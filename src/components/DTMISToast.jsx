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
  Info
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
    progress: 'bg-red-500',
    close: <XCircle size={20} />
  },

  LoginError: {
    icon: <AlertTriangle size={30} />,
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
  autoClose = 5000
}) {
  const style = toastStyles[type]

  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`
        relative overflow-hidden
        w-full
        rounded-lg
        border-l-4
        shadow-md
        backdrop-blur-sm
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
      <div className="flex gap-3 p-4 pr-10">
        <div className="mt-0.5">
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
            <p className="mt-1 text-xs opacity-70" style={{ marginTop: '-10px' }}>
              {subMessage}
            </p>
          )}
        </div>
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
            animationPlayState: isHovered ? 'paused' : 'running',
            animationDuration: `${autoClose}ms`
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
      ({ toastProps }) => (
        <CustomToast
          type="success"
          title={title}
          message={message}
          isPaused={toastProps.isPaused}
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
      ({ toastProps }) => (
        <CustomToast
          type="error"
          title={title}
          message={message}
          isPaused={toastProps.isPaused}
          autoClose={5000}
          onclick={() => toast.dismiss(toastProps.toastId)}
        />
      ),
      {
        ...baseConfig,
        autoClose: 5000,
        ariaLabel: 'Error notification'
      }
    )
  },

  LoginError(title, message, subMessage) {
    toast(
      ({ toastProps }) => (
        <CustomToast
          type="LoginError"
          title={title}
          message={message}
          subMessage={subMessage}
          isPaused={toastProps.isPaused}
          autoClose={5000}
        />
      ),
      {
        ...baseConfig,
        autoClose: 5000,
        ariaLabel: 'Sign-in Failed'
      }
    )
  },

  warning(title, message) {
    toast(
      ({ toastProps }) => (
        <CustomToast
          type="warning"
          title={title}
          message={message}
          isPaused={toastProps.isPaused}
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
      ({ toastProps }) => (
        <CustomToast
          type="info"
          title={title}
          message={message}
          isPaused={toastProps.isPaused}
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
      stacked
      limit={5}
      toastClassName={() =>
        '!bg-transparent !shadow-none !p-0 mb-3'
      }
    />
  )
}