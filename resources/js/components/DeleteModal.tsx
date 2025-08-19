// resources/js/components/Modal.tsx
import { Dialog, Transition } from '@headlessui/react';
import { Trash2 } from 'lucide-react';
import { Fragment } from 'react';

export default function DeleteModal({ isModalOpen, onClose, title, size = 'max-w-sm', onConfirm, children }) {
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
                            enter="transition transform duration-300 ease-out"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className={`w-full max-w-md ${size} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}
                            >
                                {/* Icon + Title */}
                                <div className="flex flex-col items-center text-center">
                                    <Transition
                                        appear
                                        show={true} // ให้เป็น true เมื่อ modal เปิด
                                        as={Fragment}
                                        enter="transition transform duration-300 ease-out"
                                        enterFrom="opacity-0 scale-75 rotate-[-25deg]"
                                        enterTo="opacity-100 scale-100 rotate-0"
                                        leave="transition transform duration-200 ease-in"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-75"
                                    >
                                        <div className="mb-2 flex items-center justify-center">
                                            <Trash2 className="mb-2 h-32 w-32 text-red-600 stroke-2" />
                                        </div>
                                    </Transition>

                                    <Dialog.Title className="text-xl font-semibold text-gray-900">{title}</Dialog.Title>
                                </div>

                                {/* Content */}
                                <div className="mt-4 text-center text-gray-600">{children}</div>

                                {/* Buttons */}
                                <div className="mt-6 flex justify-center space-x-4">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                                        onClick={onConfirm}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
