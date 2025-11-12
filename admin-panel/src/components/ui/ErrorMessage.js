import { motion } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ErrorMessage = ({ message, onClose, type = 'error' }) => {
  const bgColor = type === 'error' ? 'bg-red-50' : 'bg-yellow-50';
  const borderColor = type === 'error' ? 'border-red-200' : 'border-yellow-200';
  const textColor = type === 'error' ? 'text-red-800' : 'text-yellow-800';
  const iconColor = type === 'error' ? 'text-red-400' : 'text-yellow-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-md ${bgColor} ${borderColor} border p-4`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${textColor}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md ${bgColor} p-1.5 ${iconColor} hover:${iconColor.replace('400', '500')} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600`}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ErrorMessage;
