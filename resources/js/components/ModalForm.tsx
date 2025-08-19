// resources/js/components/Modal.tsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';

interface ModalFormProps {
    isModalOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: string;
    children?: ReactNode; // ถ้าต้องการส่ง content แบบ custom
}

export default function ModalForm({
    isModalOpen,
    onClose,
    title = 'Modal title',
    description = 'Modal description',
    size = 'max-w-lg',
    children,
}: ModalFormProps) {
    return (
        <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className={`w-full ${size} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}
                            >
                                <div className="flex items-center justify-between">
                                    <Dialog.Title className="text-2xl leading-6 font-semibold text-gray-900 font-anuphan">{title}</Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full bg-transparent p-1.5 text-gray-500 transition-colors duration-200 hover:bg-red-500 hover:text-white focus:ring-2 focus:ring-red-300 focus:outline-none"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div className="mt-0">
                                    {description && <p className="mb-4 text-sm text-gray-600 font-anuphan">{description}</p>}
                                    <div className="space-y-4">{children}</div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
