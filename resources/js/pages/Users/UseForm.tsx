import { useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

export default function UserForm({ mode = 'create', user = null, roles = [], onClose = () => {}, employees = [], currentEmployee = null }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        roles: [],
        employee_id: null,
    });

    const [employeeSearch, setEmployeeSearch] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState(employees);
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (mode === 'edit' && user) {
            const userRoleNames = user.roles.map((r) => r.name);
            setData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                roles: userRoleNames,
                employee_id: user.employee_id || null,
            });

            if (user.employee_id && currentEmployee) {
                setEmployeeSearch(`${currentEmployee.EmpCode} - ${currentEmployee.EmpName}`);
            }
        } else {
            reset();
            setEmployeeSearch('');
            setData('employee_id', null);
        }
    }, [mode, user, reset, setData, currentEmployee]);

    useEffect(() => {
        const filtered = employees.filter(
            (emp) =>
                (emp.EmpName ?? '').toLowerCase().includes(employeeSearch.toLowerCase()) ||
                String(emp.EmpCode ?? '')
                    .toLowerCase()
                    .includes(employeeSearch.toLowerCase()),
        );
        setFilteredEmployees(filtered);

        if (employeeSearch && filtered.length > 0) {
            setShowEmployeeDropdown(true);
        } else {
            setShowEmployeeDropdown(false);
        }
    }, [employeeSearch, employees]);

    // ปิด dropdown เมื่อคลิกนอกพื้นที่
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && inputRef.current && !inputRef.current.contains(event.target)) {
                setShowEmployeeDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectEmployee = (emp) => {
        setData('employee_id', emp.EmpID);
        setEmployeeSearch(`${emp.EmpCode} - ${emp.EmpName}`);
        setShowEmployeeDropdown(false);
    };

    const clearEmployee = () => {
        setData('employee_id', null);
        setEmployeeSearch('');
        setShowEmployeeDropdown(false);
    };

    const handleRoleChange = (roleName, checked) => {
        if (checked) {
            setData('roles', [...data.roles, roleName]);
        } else {
            setData(
                'roles',
                data.roles.filter((r) => r !== roleName),
            );
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (mode === 'create' && !data.password) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Password is required for new users',
            });
            return;
        }

        const submitData = { ...data };
        if (mode === 'create') {
            delete submitData.employee_id;
        }

        if (!submitData.password) delete submitData.password;

        if (mode === 'create') {
            post(route('users.store'), {
                data: submitData,
                onSuccess: () => {
                    Swal.fire({
                        position: 'center',
                        icon: 'success',
                        title: 'User created successfully',
                        showConfirmButton: false,
                        timer: 1500,
                    });
                    onClose();
                    reset();
                },
                onError: (errors) => {
                    if (errors.email) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: errors.email,
                        });
                    }
                },
            });
        } else {
            put(route('users.update', user.id), {
                data: submitData,
                onSuccess: () => {
                    Swal.fire({
                        position: 'center',
                        icon: 'success',
                        title: 'User updated successfully',
                        showConfirmButton: false,
                        timer: 1500,
                    });
                    onClose();
                },
                onError: (errors) => {
                    if (errors.email) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: errors.email,
                        });
                    } else if (errors.employee_id) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: errors.employee_id,
                        });
                    }
                },
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection - แสดงเฉพาะในโหมด edit */}
            {mode === 'edit' && (
                <div className="relative">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Employee (Optional)</label>
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            onFocus={() => setShowEmployeeDropdown(true)}
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 font-anuphan shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            placeholder="Search by employee code or name..."
                            disabled={mode === 'create'}
                        />
                        {data.employee_id && (
                            <button
                                type="button"
                                onClick={clearEmployee}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500 transition-colors hover:text-red-700"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {showEmployeeDropdown && filteredEmployees.length > 0 && (
                        <div
                            ref={dropdownRef}
                            className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white font-anuphan shadow-lg"
                            style={{
                                top: '100%',
                                left: 0,
                                right: 0,
                            }}
                        >
                            {filteredEmployees.map((emp) => (
                                <div
                                    key={emp.EmpID}
                                    onClick={() => selectEmployee(emp)}
                                    className="cursor-pointer border-b border-gray-100 p-3 font-anuphan transition-colors last:border-b-0 hover:bg-gray-50"
                                >
                                    <div className="font-medium text-gray-900">{emp.EmpName}</div>
                                    <div className="text-sm text-gray-600">
                                        {emp.EmpCode} • {emp.Position} • {emp.DeptID}
                                    </div>
                                    {emp.Email && <div className="mt-1 text-xs text-gray-500">{emp.Email}</div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {data.employee_id && (
                        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 font-anuphan">
                            <p className="text-sm text-green-800">
                                <span className="font-medium">Selected:</span> {employeeSearch}
                            </p>
                        </div>
                    )}

                    {mode === 'create' && <p className="mt-2 text-sm text-gray-500">Employee linking is only available after user creation.</p>}
                </div>
            )}

            {/* Name Field */}
            <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 font-anuphan shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter full name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    id="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 font-anuphan shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter email address"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                    Password {mode === 'create' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        required={mode === 'create'}
                        minLength={8}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        placeholder={mode === 'edit' ? 'Leave blank to keep current password' : 'Enter password'}
                    />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                            </svg>
                        )}
                    </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            {/* Roles Field */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Roles</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {roles.map((role) => (
                        <label
                            key={role.id}
                            className="flex cursor-pointer items-center rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                        >
                            <input
                                type="checkbox"
                                checked={data.roles.includes(role.name)}
                                onChange={(e) => handleRoleChange(role.name, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">{role.name}</span>
                        </label>
                    ))}
                </div>
                {errors.roles && <p className="mt-1 text-sm text-red-600">{errors.roles}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                >
                    {processing ? (
                        <span className="flex items-center">
                            <svg
                                className="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            {mode === 'create' ? 'Creating...' : 'Updating...'}
                        </span>
                    ) : (
                        <span>{mode === 'create' ? 'Create User' : 'Update User'}</span>
                    )}
                </button>
            </div>
        </form>
    );
}
