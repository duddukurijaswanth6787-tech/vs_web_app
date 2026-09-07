'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Search,
  RefreshCw,
  User,
  Calendar,
  CheckSquare,
  Square,
  Sparkles,
  TrendingUp,
  Percent,
  Briefcase,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

interface StaffTask {
  id: string;
  staffProfileId: string;
  staffName: string;
  employeeId: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  completedAt?: string;
  assignedByName?: string;
  notes?: string;
  createdAt: string;
}

interface StaffMemberOption {
  id: string;
  employeeId: string;
  name: string;
  department: string;
}

interface PerformanceSummary {
  staffProfileId: string;
  employeeId: string;
  staffName: string;
  department: string;
  designation: string;
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  totalHoursWorked: number;
  attendanceRatePercent: number;
  totalTasksAssigned: number;
  tasksCompleted: number;
  taskCompletionRatePercent: number;
  estimatedPayableHours: number;
}

export default function StaffTasksPage() {
  const searchParams = useSearchParams();
  const staffIdFromUrl = searchParams.get('staffId') || '';

  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffIdFromUrl);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [staffList, setStaffList] = useState<StaffMemberOption[]>([]);
  const [perfSummary, setPerfSummary] = useState<PerformanceSummary | null>(null);

  // New task modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newTaskStaffId, setNewTaskStaffId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const fetchStaffOptions = async () => {
    try {
      const res = await apiClient.get('/staff?limit=100');
      const items = res.data?.data?.data || [];
      const opts: StaffMemberOption[] = items.map((s: any) => ({
        id: s.id,
        employeeId: s.employeeId,
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        department: s.department,
      }));
      setStaffList(opts);
      if (!selectedStaffId && opts[0]) {
        setSelectedStaffId(opts[0].id);
      }
    } catch {
      // Ignored
    }
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedStaffId) params.set('staffProfileId', selectedStaffId);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);

      const res = await apiClient.get(`/staff/tasks?${params.toString()}`);
      setTasks(res.data?.data || []);

      if (selectedStaffId) {
        const perfRes = await apiClient.get(`/staff/performance/${selectedStaffId}`);
        setPerfSummary(perfRes.data?.data || null);
      } else {
        setPerfSummary(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedStaffId, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchStaffOptions();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !newTaskStaffId) {
      alert('Please enter a task title and select a staff member.');
      return;
    }
    setCreateLoading(true);
    try {
      await apiClient.post('/staff/tasks', {
        staffProfileId: newTaskStaffId,
        title: taskTitle,
        description: taskDesc || undefined,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
      });
      setIsModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      setSuccessBanner('Task assigned successfully!');
      setTimeout(() => setSuccessBanner(''), 4000);
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create task');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/staff/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.staffName.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  const columns: Column<StaffTask>[] = [
    {
      key: 'title',
      label: 'Task Details',
      render: (t) => (
        <div>
          <span className="font-bold text-neutral-900 text-xs block">{t.title}</span>
          {t.description && <p className="text-[11px] text-neutral-500 line-clamp-1">{t.description}</p>}
          <span className="text-[10px] text-neutral-400 font-mono">Assigned to: {t.staffName} ({t.employeeId})</span>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (t) => {
        if (t.priority === 'URGENT') {
          return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Flame className="w-3 h-3 text-red-600" /> URGENT</span>;
        }
        if (t.priority === 'HIGH') {
          return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">HIGH</span>;
        }
        if (t.priority === 'LOW') {
          return <span className="bg-neutral-100 text-neutral-600 text-[10px] font-medium px-2 py-0.5 rounded-full w-fit">LOW</span>;
        }
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit">MEDIUM</span>;
      },
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (t) =>
        t.dueDate ? (
          <span className="text-xs font-semibold text-neutral-700">
            {new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        ) : (
          <span className="text-neutral-400 text-xs">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (t) => (
        <select
          value={t.status}
          onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
          className={`px-2 py-1 rounded-lg text-2xs font-bold border ${
            t.status === 'COMPLETED'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : t.status === 'IN_PROGRESS'
              ? 'bg-sky-50 border-sky-300 text-sky-800'
              : 'bg-neutral-50 border-neutral-300 text-neutral-700'
          }`}
        >
          <option value="PENDING">PENDING</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
              Staff Tasks &amp; ERP Performance Tracking
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Assign daily tasks, track completion metrics, and review monthly attendance performance for payroll.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => {
              setNewTaskStaffId(selectedStaffId || staffList[0]?.id || '');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" /> Assign New Task
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Staff Selector & Performance Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-700">Select Staff Member:</span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-neutral-900"
            >
              <option value="">All Staff Members</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employeeId} · {s.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Performance Scorecard */}
        {perfSummary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Monthly Attendance Rate</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-neutral-900">{perfSummary.attendanceRatePercent}%</span>
                <span className="text-xs text-neutral-500">({perfSummary.presentDays}/{perfSummary.totalWorkingDays} days)</span>
              </div>
              <p className="text-[11px] text-amber-600 mt-0.5">{perfSummary.lateDays} late check-in(s)</p>
            </div>

            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Total Working Hours</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-mono font-bold text-neutral-900">{perfSummary.totalHoursWorked} hrs</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5 font-semibold">Ready for Payroll Export</p>
            </div>

            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Task Completion Rate</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-purple-700">{perfSummary.taskCompletionRatePercent}%</span>
                <span className="text-xs text-neutral-500">({perfSummary.tasksCompleted}/{perfSummary.totalTasksAssigned})</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Assigned store deliverables</p>
            </div>

            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Staff Profile</span>
              <div className="mt-1">
                <span className="text-sm font-bold text-neutral-900 block">{perfSummary.staffName}</span>
                <span className="text-[11px] text-neutral-500">{perfSummary.designation} · {perfSummary.department}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Filters */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-neutral-900"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-neutral-900"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task title, staff name..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Task List DataTable */}
      <DataTable
        columns={columns}
        data={filteredTasks}
        total={filteredTasks.length}
        page={1}
        pageSize={50}
        loading={loading}
        error={!!error}
        onRetry={fetchTasks}
        onPageChange={() => {}}
        rowKey={(t) => t.id}
        emptyMessage="No tasks found matching the criteria."
      />

      {/* Assign Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateTask}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">Assign New Task</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Assign to Staff Member *</label>
                <select
                  value={newTaskStaffId}
                  onChange={(e) => setNewTaskStaffId(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-neutral-900"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employeeId} · {s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Audit festive silk sarees stock & print labels"
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Detailed guidelines, rack numbers, customer references..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-neutral-900"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Assign Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
