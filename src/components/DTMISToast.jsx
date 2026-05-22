/* eslint-disable react-refresh/only-export-components */
import {
  ToastContainer,
  toast,
  Slide
} from 'react-toastify'

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react'

import { useState } from 'react'

const toastStyles = {
  success: {
    icon: <CheckCircle size={20} />,
    border: 'border-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    progress: 'bg-emerald-500'
  },

  error: {
    icon: <XCircle size={20} />,
    border: 'border-red-500',
    bg: 'bg-red-50',
    text: 'text-red-900',
    progress: 'bg-red-500'
  },

  LoginError: {
    icon: <AlertTriangle size={20} />,
    border: 'border-red-500',
    bg: 'bg-red-50',
    text: 'text-red-900',
    progress: 'bg-red-500'
  },

  warning: {
    icon: <AlertTriangle size={20} />,
    border: 'border-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    progress: 'bg-amber-500'
  },

  info: {
    icon: <Info size={20} />,
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    progress: 'bg-blue-500'
  }
}

function CustomToast({
  type = 'info',
  title,
  message,
  subMessage,
  closeToast,
  autoClose = 5000
}) {
  const style = toastStyles[type]

  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`
        relative overflow-hidden
        w-full min-h-[72px]
        rounded-lg
        border-l-4
        shadow-md
        backdrop-blur-sm
        transition-all duration-300 ease-out
        will-change-transform
        hover:shadow-lg
        ${style.border}
        ${style.bg}
        ${style.text}
      `}
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* CONTENT */}
      <div className="flex gap-3 p-4">
        <div className="mt-0.5 shrink-0">
          {style.icon}
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-bold tracking-wide">
            {title}
          </h4>

          {message && (
            <p className="mt-1 text-sm opacity-90">
              {message}
            </p>
          )}

          {subMessage && (
            <p
              className="mt-1 text-xs opacity-70"
              style={{ marginTop: '-2px' }}
            >
              {subMessage}
            </p>
          )}
        </div>
        {/* CLOSE BUTTON */}
        <button
          onClick={closeToast}
          className="
            absolute top-3 right-3
            z-20

            !bg-transparent
            !border-0
            !shadow-none
            !outline-none
            !ring-0

            !p-5
            !m-0

            !min-w-0
            !w-auto
            !h-auto

            !rounded-none

            text-current
            cursor-pointer

            flex items-center justify-center

            hover:!bg-transparent
            focus:!bg-transparent
            active:!bg-transparent

            appearance-none
          "
          aria-label="Close notification"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>


      {/* CUSTOM PROGRESS BAR */}
      <div className="h-1 w-full bg-black/5">
        <div
          className={`
            h-full
            ${style.progress}
            animate-progress
          `}
          style={{
            animationPlayState: isHovered
              ? 'paused'
              : 'running',
            animationDuration: `${autoClose - 150}ms`
          }}
        />
      </div>
    </div>
  )
}

const baseConfig = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: true,
  closeButton: false,
  pauseOnHover: true,
  draggable: true,
  theme: 'light',
  transition: Slide
}

export const notify = {
  success(title, message) {
    toast(
      ({ closeToast }) => (
        <CustomToast
          type="success"
          title={title}
          message={message}
          closeToast={closeToast}
          autoClose={baseConfig.autoClose}
        />
      ),
      {
        ...baseConfig,
        ariaLabel: 'Success notification'
      }
    )
  },

  error(title, message) {
    toast(
      ({ closeToast }) => (
        <CustomToast
          type="error"
          title={title}
          message={message}
          closeToast={closeToast}
          autoClose={baseConfig.autoClose}
        />
      ),
      {
        ...baseConfig,
        ariaLabel: 'Error notification'
      }
    )
  },

  LoginError(title, message, subMessage) {
    toast(
      ({ closeToast }) => (
        <CustomToast
          type="LoginError"
          title={title}
          message={message}
          subMessage={subMessage}
          closeToast={closeToast}
          autoClose={baseConfig.autoClose}
        />
      ),
      {
        ...baseConfig,
        ariaLabel: 'Sign-in Failed'
      }
    )
  },

  warning(title, message) {
    toast(
      ({ closeToast }) => (
        <CustomToast
          type="warning"
          title={title}
          message={message}
          closeToast={closeToast}
          autoClose={baseConfig.autoClose}
        />
      ),
      {
        ...baseConfig,
        ariaLabel: 'Warning notification'
      }
    )
  },

  info(title, message) {
    toast(
      ({ closeToast }) => (
        <CustomToast
          type="info"
          title={title}
          message={message}
          closeToast={closeToast}
          autoClose={baseConfig.autoClose}
        />
      ),
      {
        ...baseConfig,
        ariaLabel: 'Information notification'
      }
    )
  }
}

export function DTMISToastContainer() {
  return (
    <ToastContainer
      newestOnTop
      limit={5}
      position="top-right"
      toastClassName={() =>
        `
          !bg-transparent
          !shadow-none
          !p-0
          !mb-3

          !w-[350px]
          !min-w-[350px]
          !max-w-[350px]
        `
      }
      bodyClassName={() => '!p-0'}
      className="
        !w-[350px]
        !flex
        !flex-col
        !gap-3
      "
    />
  )
}