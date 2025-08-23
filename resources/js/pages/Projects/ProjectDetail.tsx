import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import MilestoneForm from './MilestoneForm';
import TaskForm from './TaskForm';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Projects', href: '/projects' }];
function ProgressBar({ value }) {
    return (
        <div className="h-3 w-full rounded-full bg-gray-200">
            <div className="h-3 rounded-full bg-blue-500" style={{ width: `${value}%` }}></div>
        </div>
    );
}

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

export default function ProjectDetail({ project }) {
    const p = project.data; // 👈 แกะออกมาเลย

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState('create');

    const [selectedMilestone, setSelectedMilestone] = useState(null);

    // --- Milestone ---
    function openCreateMilestone() {
        setMode('create');
        setSelectedMilestone(null);
        setIsModalOpen(true);
    }

    function openEditMilestone(milestone) {
        setMode('edit');
        setSelectedMilestone(milestone);
        setIsModalOpen(true);
    }

    // --- Task ---
    const [isModalOpenTask, setIsModalOpenTask] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    function openCreateTask() {
        setMode('create');
        setSelectedTask(null);
        setIsModalOpenTask(true);
    }

    function openEditTask(task) {
        setMode('edit');
        setSelectedTask(task);
        setIsModalOpenTask(true);
    }

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    const openDeleteModal = (id) => {
        setSelectedProjectId(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedProjectId(null);
    };

    const toDMY = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มจาก 0
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={p.name} />
            <div className="mx-auto w-full p-4">
                <div className="mx-auto mt-0 w-full space-y-6 rounded-lg bg-white px-6 pb-4 font-anuphan shadow-md">
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <div className="flex flex-col justify-between gap-4 bg-white p-2 md:flex-row md:items-center">
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-bold text-gray-800">{p.name}</h1>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span className="text-md mr-4">
                                            {toDMY(p.start_date)} - {toDMY(p.end_date)}
                                        </span>
                                        <StatusBadge status={p.status} />
                                    </div>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <Link
                                    href={route('projects.index')}
                                    className="me-2 inline-flex items-center rounded-md bg-gray-400 px-2 py-2 pr-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                                >
                                    <ChevronLeft />
                                    Back
                                </Link>
                                <button className="inline-flex items-center rounded-md bg-blue-500 px-2 py-2 pr-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                                    <Pencil className="mr-2" />
                                    แก้ไข
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-gray-600">ความคืบหน้า</p>
                        <div className="flex items-center gap-3">
                            <ProgressBar value={p.progress} />
                            <span className="text-sm font-semibold text-orange-600">{p.progress}%</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <div>
                                <h2 className="p-0 text-lg font-semibold text-gray-800">รายละเอียด</h2>
                                <p className="p-0 leading-relaxed whitespace-pre-line text-gray-700">{p.description}</p>
                            </div>
                            <div className="ml-auto">
                                <StatusBadge status={p.status} />
                            </div>
                        </div>
                    </div>

                    {/* Milestones */}
                    <div className="mt-6">
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <div>
                                    <h2 className="mb-3 flex items-center text-lg font-semibold text-gray-800">
                                        <span className="mr-2">📌</span>
                                        Milestones - เหตุการณ์หรือจุดหมายสำคัญในโครงการ
                                    </h2>
                                </div>
                                <div className="ml-auto">
                                    <p
                                        onClick={openCreateMilestone}
                                        className="inline-flex items-center text-sm font-semibold text-blue-500 hover:text-blue-600 hover:underline"
                                    >
                                        <Plus className="h-4 w-4" />
                                        เพิ่มกิจกรรม
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="w-1/4 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                        >
                                            รายการ
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-1/2 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                        >
                                            รายละเอียด
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-1/4 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                        >
                                            วันที่ครบกำหนด
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-1/4 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                        >
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {p.milestones?.length > 0 ? (
                                        p.milestones.map((m) => (
                                            <tr key={m.id} className="transition-colors hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">{m.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{m.description}</td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">{toDMY(m.due_date)}</td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => openEditMilestone(m)}
                                                        className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800 hover:bg-amber-200"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                                                ไม่มี Milestones
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tasks */}
                    <div className="mt-8">
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <div>
                                    <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                                        <span className="mr-2">✅</span>
                                        Tasks - งานย่อยที่ต้องทำให้เสร็จเพื่อไปถึง Milestone หรือเพื่อความคืบหน้าของโครงการ
                                    </h2>
                                </div>
                                <div className="ml-auto">
                                    <p
                                        onClick={openCreateTask}
                                        className="inline-flex items-center text-sm font-semibold text-blue-500 hover:text-blue-600 hover:underline"
                                    >
                                        <Plus className="h-4 w-4" />
                                        เพิ่มกิจกรรม
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="w-2/5 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                        >
                                            ชื่องาน
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-1/5 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                        >
                                            รายละเอียด
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-1/5 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                        >
                                            สถานะ
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-1/5 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                        >
                                            ความคืบหน้า
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-1/5 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                        >
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {p.tasks?.length > 0 ? (
                                        p.tasks.map((t) => (
                                            <tr key={t.id} className="transition-colors hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{t.description}</td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={t.status} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1">
                                                            <ProgressBar value={t.progress} />
                                                        </div>
                                                        <span className="w-10 text-right text-sm font-medium text-gray-700">{t.progress}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => openEditTask(t)}
                                                        className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                                                ไม่มี Tasks
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modals */}
            <ModalForm
                isModalOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={mode === 'create' ? 'เพิ่ม 📌 Milestone' : 'แก้ไข 📌 Milestone'}
                description="เหตุการณ์หรือจุดหมายสำคัญในโครงการ"
            >
                <MilestoneForm projectId={p.id} mode={mode} milestone={selectedMilestone} onClose={() => setIsModalOpen(false)} />
            </ModalForm>

            <ModalForm
                isModalOpen={isModalOpenTask}
                onClose={() => setIsModalOpenTask(false)}
                title={mode === 'create' ? 'เพิ่ม ✅ Task' : 'แก้ไข ✅ Task'}
                description="งานย่อยที่ต้องทำให้เสร็จ"
            >
                <TaskForm projectId={p.id} mode={mode} task={selectedTask} onClose={() => setIsModalOpenTask(false)} />
            </ModalForm>
        </AppLayout>
    );
}
