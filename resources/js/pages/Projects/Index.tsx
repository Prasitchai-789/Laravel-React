import DeleteModal from '@/components/DeleteModal';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Projects', href: '/projects' }];

export default function Index({ projects }) {
    // --- State ---
    const [projectList, setProjectList] = useState(projects.data || []);
    const [selectedProject, setSelectedProject] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState('create');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(projects.current_page || 1);
    const [perPage] = useState(projects.per_page || 10);
    const [totalPages, setTotalPages] = useState(projects.last_page || 1);

    // --- Modal actions ---
    function openCreate() {
        setMode('create');
        setSelectedProject(null);
        setIsModalOpen(true);
    }

    function openEdit(project) {
        setMode('edit');
        setSelectedProject(project);
        setIsModalOpen(true);
    }

    const openDeleteModal = (id) => {
        setSelectedProjectId(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedProjectId(null);
    };

    // --- Handle body overflow for modals ---
    useEffect(() => {
        if (isModalOpen || isDeleteModalOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
    }, [isModalOpen, isDeleteModalOpen]);

    // --- Fetch projects เมื่อ page หรือ search เปลี่ยน ---
    useEffect(() => {
        router.get('/projects', { page, search, per_page: perPage }, { preserveState: true, preserveScroll: true });
    }, [page, search]);

    // --- Delete Project ---
    const handleDelete = () => {
        if (!selectedProjectId) return;

        router.delete(route('projects.destroy', selectedProjectId), {
            onSuccess: () => {
                setSelectedProject((prev) => prev.filter((p) => p.id !== selectedProjectId));
                setIsDeleteModalOpen(false);
            },
        });
    };

    // --- UI Components ---
    function StatusBadge({ status }) {
        const colors = {
            in_progress: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-100 text-green-700',
            not_started: 'bg-gray-100 text-gray-700',
        };
        const statusName = {
            in_progress: 'กำลังดำเนินการ',
            completed: 'เสร็จสิ้น',
            not_started: 'ยังไม่ดำเนินการ',
        };

        return <span className={`rounded-full px-3 py-1 text-sm font-medium ${colors[status]}`}>{statusName[status]}</span>;
    }

    function ProgressBar({ value }) {
        return (
            <div className="h-3 w-full rounded-full bg-gray-200">
                <div className="h-3 rounded-full bg-blue-500" style={{ width: `${value}%` }}></div>
            </div>
        );
    }

    // --- Render ---
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />

            <div className="p-4">
                <h1 className="mb-4 font-anuphan text-2xl font-bold">📊 ติดตามโครงการ</h1>
                {/* Search */}
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-2 w-full border p-2 rounded-lg max-w-md pl-4"
                />
            </div>

            {/* Table View */}
            <div className="mx-auto w-full px-4">

                <div className="overflow-x-auto rounded-lg bg-white font-anuphan shadow-md">
                    <table className="w-full border-collapse text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-600">ชื่อโครงการ</th>
                                <th className="px-6 py-3 text-center font-semibold text-gray-600">สถานะ</th>
                                <th className="px-6 py-3 text-center font-semibold text-gray-600">ความคืบหน้า</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">ผู้รับผิดชอบ</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectList.map((p) => (
                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-3">
                                        <div>
                                            <h2 className="font-semibold">
                                                <Link href={`/projects/${p.id}`} className="text-blue-700 hover:underline">
                                                    {p.name}
                                                </Link>
                                            </h2>
                                            <p className="text-sm text-gray-500">{p.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <StatusBadge status={p.status} />
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex items-center gap-3">
                                            <ProgressBar value={p.progress} />
                                            <span className="text-sm font-medium">{p.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">{p.owner}</td>
                                    <td className="px-6 py-3 font-semibold text-blue-600">
                                        <div className="mt-2 flex space-x-2">
                                            <button
                                                onClick={() => openEdit(p)}
                                                className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(p)}
                                                className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ModalForm */}
            <ModalForm isModalOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={mode === 'create' ? 'Create Project' : 'Edit Project'} description="บันทึกข้อมูลโครงการ">
                {/* <UseForm mode={mode} user={selectedUser} roles={roles} onClose={() => setIsModalOpen(false)} /> */}
            </ModalForm>

            {/* DeleteModal */}
            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Delete Project" onConfirm={handleDelete} >
                <p className="text-sm text-gray-500">Are you sure you want to delete this Project ? This action cannot be undone.</p>
            </DeleteModal>
        </AppLayout>
    );
}
