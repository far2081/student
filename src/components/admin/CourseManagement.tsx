import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Users,
  Clock,
  CreditCard,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const CourseManagement: React.FC = () => {
  const { courses, students, addCourse, updateCourse, toggleCourseStatus, deleteCourse } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    duration: '3 Months',
    fee_pkr: 45000,
    is_active: true,
    installments_allowed: 2,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      duration: '3 Months',
      fee_pkr: 40000,
      is_active: true,
      installments_allowed: 2,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      description: course.description || '',
      duration: course.duration,
      fee_pkr: course.fee_pkr,
      is_active: course.is_active,
      installments_allowed: course.installments_allowed,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.code.trim() || !formData.name.trim()) {
      setErrorMessage('Course code and course title are required.');
      return;
    }

    if (formData.fee_pkr < 0) {
      setErrorMessage('Course fee in PKR cannot be negative.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCourse) {
        const success = await updateCourse(editingCourse.id, formData);
        if (!success) setErrorMessage('Failed to update course.');
        else setIsModalOpen(false);
      } else {
        const success = await addCourse(formData);
        if (!success) setErrorMessage('Failed to add new course. Ensure code is unique.');
        else setIsModalOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    const res = await deleteCourse(courseId);
    if (!res.success) {
      alert(res.error || 'Failed to delete course.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Course & Curriculum Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure academic offerings, durations, fee structures (PKR), and active status.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-100 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Course
        </button>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const enrolledCount = students.filter(
            (s) => s.course_id === course.id && s.admission_status !== 'archived'
          ).length;

          return (
            <div
              key={course.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                course.is_active
                  ? 'border-slate-200/90 shadow-sm hover:shadow-md'
                  : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {course.code}
                  </span>
                  <button
                    onClick={() => toggleCourseStatus(course.id)}
                    className="flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    title={course.is_active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {course.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <ToggleRight className="w-5 h-5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <ToggleLeft className="w-5 h-5" /> Inactive
                      </span>
                    )}
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{course.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {course.description || 'No description provided.'}
                </p>

                <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" /> Duration
                    </span>
                    <span className="font-semibold">{course.duration}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-400">
                      <CreditCard className="w-3.5 h-3.5" /> Course Fee
                    </span>
                    <span className="font-extrabold text-indigo-600 text-sm">
                      PKR {course.fee_pkr.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3.5 h-3.5" /> Enrolled Students
                    </span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                      {enrolledCount} Students
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(course)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                  title="Edit Course"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCourse ? 'Edit Course Details' : 'Add New Academic Course'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. AI-201"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Duration <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 3 Months"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Artificial Intelligence & Generative Agents"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Course Fee in PKR <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={formData.fee_pkr}
                  onChange={(e) => setFormData({ ...formData, fee_pkr: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description / Syllabus Summary
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Course is Active & Enrollable</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
