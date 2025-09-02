import DeleteModal from '@/components/DeleteModal';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ProjectForm from './ProjectForm';

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

    useEffect(() => {
        setProjectList(projects.data || []);
        setPage(projects.current_page || 1);
        setTotalPages(projects.last_page || 1);
    }, [projects]);

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
            <div className="mx-auto w-full px-4 py-8 font-anuphan sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">📊 ติดตามโครงการ</h1>
                    <p className="mt-2 text-gray-600"></p>
                </div>

                {/* Search and Create Button in the same row */}
                <div className="mb-6 flex flex-col gap-4 font-anuphan sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                ></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search roles or permissions..."
                            className="block w-full rounded-xl border-0 bg-white py-3 pr-3 pl-10 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => openCreate()}
                        className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-102 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
                    >
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Create
                    </button>
                </div>

                {/* Table View */}
                <div className="mx-auto w-full">
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
                                                {/* <button
                                                    onClick={() => openDeleteModal(p)}
                                                    className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                                                >
                                                    Delete
                                                </button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* ModalForm */}
            <ModalForm
                isModalOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={mode === 'create' ? 'Create Project' : 'Edit Project'}
                description="บันทึกข้อมูลโครงการ"
            >
                <ProjectForm mode={mode} project={selectedProject} onClose={() => setIsModalOpen(false)} />
            </ModalForm>

            {/* DeleteModal */}
            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Delete Project" onConfirm={handleDelete}>
                <p className="text-sm text-gray-500">Are you sure you want to delete this Project ? This action cannot be undone.</p>
            </DeleteModal>
        </AppLayout>
    );
}
