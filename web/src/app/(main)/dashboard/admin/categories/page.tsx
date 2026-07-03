"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
  AlignLeft,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { api, APIError } from "@/lib/api";

// Types
interface EventCategoryResponse {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Mock data
const MOCK_CATEGORIES: EventCategoryResponse[] = [
  {
    id: "cat-001",
    name: "Music",
    description: "Concerts, festivals, live performances and music events.",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-002",
    name: "Technology",
    description: "Tech conferences, hackathons, and developer meetups.",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-003",
    name: "Arts & Culture",
    description: "Art exhibitions, cultural festivals, and creative showcases.",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-004",
    name: "Business",
    description: "Networking events, seminars, and professional development.",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-005",
    name: "Sports & Fitness",
    description: "Sporting events, fitness classes, and wellness activities.",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

// Schema
const categorySchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
});

type CategoryForm = z.infer<typeof categorySchema>;

// Styled input
const inputClass =
  "w-full h-11 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/8 transition-all duration-200 px-4";

const inputInvalidClass =
  "w-full h-11 rounded-xl bg-white/4 border border-red-500/40 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/60 transition-all duration-200 px-4";

const textareaClass =
  "w-full rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/8 transition-all duration-200 px-4 py-3 resize-none leading-relaxed";

const textareaInvalidClass =
  "w-full rounded-xl bg-white/4 border border-red-500/40 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/60 transition-all duration-200 px-4 py-3 resize-none leading-relaxed";

// Form field
function FormField({
  icon: Icon,
  label,
  error,
  children,
}: {
  icon: React.ElementType;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-white/25" />
        <label className="text-white/50 text-xs font-black uppercase tracking-widest">
          {label}
        </label>
      </div>
      {children}
      {error && <p className="text-red-400 text-xs pl-5">{error}</p>}
    </div>
  );
}

// Category form fields — shared by add and edit
function CategoryFormFields({
  form,
}: {
  form: ReturnType<typeof useForm<CategoryForm>>;
}) {
  return (
    <>
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <FormField icon={Tag} label="Name" error={fieldState.error?.message}>
            <input
              {...field}
              placeholder="e.g. Music, Technology, Arts & Culture"
              className={fieldState.invalid ? inputInvalidClass : inputClass}
            />
          </FormField>
        )}
      />
      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <FormField
            icon={AlignLeft}
            label="Description"
            error={fieldState.error?.message}>
            <textarea
              {...field}
              rows={3}
              placeholder="Describe what types of events belong in this category…"
              className={
                fieldState.invalid ? textareaInvalidClass : textareaClass
              }
            />
          </FormField>
        )}
      />
    </>
  );
}

// Delete confirm
function DeleteConfirm({
  category,
  onConfirm,
  onCancel,
}: {
  category: EventCategoryResponse;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/4 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-bold text-sm">
            Delete &quot;{category.name}&quot;?
          </p>
          <p className="text-white/30 text-xs mt-1 leading-relaxed">
            Events using this category will lose their categorisation. This
            cannot be undone.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-lg text-white/40 hover:text-white/70 text-xs font-bold transition-colors">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-9 px-4 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors">
          Delete category
        </button>
      </div>
    </div>
  );
}

// Category card
function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: EventCategoryResponse;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (confirmingDelete) {
    return (
      <DeleteConfirm
        category={category}
        onConfirm={onDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    );
  }

  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-white/4 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Tag className="w-4 h-4 text-orange-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-sm font-bold leading-tight">
          {category.name}
        </p>
        <p className="text-white/30 text-xs mt-1 leading-relaxed">
          {category.description}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="text-white/25 hover:text-white/60 transition-colors p-1.5 rounded-lg hover:bg-white/6">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="text-red-400/40 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/8">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Page
export default function AdminCategoriesPage() {
  const [categories, setCategories] =
    useState<EventCategoryResponse[]>(MOCK_CATEGORIES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const handleAdd = async (data: CategoryForm) => {
    try {
      const res = await api.post("/api/v1/event-categories", {
        name: data.name,
        description: data.description,
      });
      const json = await res.json();
      setCategories((prev) => [...prev, json.data]);
      addForm.reset();
      setShowAddForm(false);
      toast.success(`"${data.name}" created.`);
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  const startEdit = (category: EventCategoryResponse) => {
    editForm.reset({ name: category.name, description: category.description });
    setEditingId(category.id);
    setShowAddForm(false);
  };

  const handleUpdate = async (data: CategoryForm) => {
    if (!editingId) return;
    try {
      const res = await api.patch(
        `/api/v1/admin/event-categories/${editingId}`,
        { name: data.name, description: data.description },
      );
      const json = await res.json();
      setCategories((prev) =>
        prev.map((c) => (c.id === editingId ? json.data : c)),
      );
      setEditingId(null);
      toast.success(`"${data.name}" updated.`);
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/v1/admin/event-categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted.");
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
            Admin
          </p>
          <h1 className="text-white font-black text-3xl tracking-tight">
            Categories
          </h1>
          <p className="text-white/30 text-sm mt-1">
            {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>

        {!showAddForm && !editingId && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="h-10 px-4 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Add category
          </button>
        )}
      </div>

      {/* add form */}
      {showAddForm && (
        <form
          onSubmit={addForm.handleSubmit(handleAdd)}
          className="rounded-2xl border border-orange-500/15 bg-orange-500/3 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-sm tracking-tight">
              New category
            </h2>
            <button
              type="button"
              onClick={() => {
                addForm.reset();
                setShowAddForm(false);
              }}
              className="text-white/25 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/6">
              <X className="w-4 h-4" />
            </button>
          </div>

          <CategoryFormFields form={addForm} />

          <div className="flex items-center justify-end pt-2 border-t border-white/6">
            <button
              type="submit"
              disabled={addForm.formState.isSubmitting}
              className="h-11 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {addForm.formState.isSubmitting ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create category
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* list */}
      {categories.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/6 bg-white/2">
          <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <Tag className="w-5 h-5 text-white/15" />
          </div>
          <p className="text-white/30 text-sm mb-4">No categories yet.</p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="h-10 px-4 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add category
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          {categories.map((category) =>
            editingId === category.id ? (
              <form
                key={category.id}
                onSubmit={editForm.handleSubmit(handleUpdate)}
                className="border-b border-white/4 last:border-0 p-5 space-y-5 bg-orange-500/3">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-black text-sm tracking-tight">
                    Editing &quot;{category.name}&quot;
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-white/25 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/6">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <CategoryFormFields form={editForm} />

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/6">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="h-11 px-4 text-white/30 hover:text-white/60 text-sm font-semibold transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editForm.formState.isSubmitting}
                    className="h-11 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {editForm.formState.isSubmitting ? (
                      <>
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={() => startEdit(category)}
                onDelete={() => handleDelete(category.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
