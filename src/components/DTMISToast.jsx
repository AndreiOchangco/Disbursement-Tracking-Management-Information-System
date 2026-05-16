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

import 'react-toastify/dist/ReactToastify.css'

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
  closeToast,
  isPaused
}) {
  const style = toastStyles[type]

  return (
    <div
      className={`
        relative overflow-hidden
        w-full
        rounded-2xl
        border-l-4
        shadow-lg
        backdrop-blur-sm
        ${style.border}
        ${style.bg}
        ${style.text}
      `}
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

          <p className="mt-1 text-sm opacity-90">
            {message}
          </p>
        </div>

        <button
          onClick={closeToast}
          className="
            absolute top-3 right-3
            opacity-60 hover:opacity-100
            transition
          "
        >
          <X size={16} />
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
            animationPlayState: isPaused
              ? 'paused'
              : 'running'
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
      ({ closeToast, isPaused }) => (
        <CustomToast
          type="success"
          title={title}
          message={message}
          closeToast={closeToast}
          isPaused={isPaused}
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
      ({ closeToast, isPaused }) => (
        <CustomToast
          type="error"
          title={title}
          message={message}
          closeToast={closeToast}
          isPaused={isPaused}
        />
      ),
      {
        ...baseConfig,
        autoClose: 5000,
        ariaLabel: 'Error notification'
      }
    )
  },

  warning(title, message) {
    toast(
      ({ closeToast, isPaused }) => (
        <CustomToast
          type="warning"
          title={title}
          message={message}
          closeToast={closeToast}
          isPaused={isPaused}
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
      ({ closeToast, isPaused }) => (
        <CustomToast
          type="info"
          title={title}
          message={message}
          closeToast={closeToast}
          isPaused={isPaused}
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