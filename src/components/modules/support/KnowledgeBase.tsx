"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, FileText, Pencil, Trash2 } from "lucide-react";
import { useSupportStore } from "@/store/support";
import { KnowledgeBaseArticle } from "@/types/models";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "getting-started", label: "Getting Started" },
  { value: "billing", label: "Billing" },
  { value: "troubleshooting", label: "Troubleshooting" },
  { value: "faq", label: "FAQ" },
];

export function KnowledgeBase() {
  const { articles, addArticle, updateArticle, deleteArticle } = useSupportStore();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editArticle, setEditArticle] = useState<KnowledgeBaseArticle | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    );
  }, [articles, search]);

  useEffect(() => {
    if (formOpen) {
      if (editArticle) {
        setTitle(editArticle.title);
        setCategory(editArticle.category);
        setContent(editArticle.content);
        setPublished(editArticle.published);
      } else {
        setTitle("");
        setCategory("general");
        setContent("");
        setPublished(false);
      }
      setErrors({});
    }
  }, [formOpen, editArticle]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!content.trim()) errs.content = "Content is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      title: title.trim(),
      category,
      content: content.trim(),
      published,
    };

    if (editArticle) {
      updateArticle(editArticle.id, data);
    } else {
      addArticle(data);
    }

    setFormOpen(false);
    setEditArticle(undefined);
  };

  const handleEdit = (article: KnowledgeBaseArticle) => {
    setEditArticle(article);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (confirmDeleteId) {
      deleteArticle(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const handleNewArticle = () => {
    setEditArticle(undefined);
    setFormOpen(true);
  };

  const articleToDelete = confirmDeleteId
    ? articles.find((a) => a.id === confirmDeleteId)
    : undefined;

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search articles..."
          />
        </div>
        <Button onClick={handleNewArticle}>
          <Plus className="w-4 h-4" />
          New Article
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10" />}
          title="No articles yet"
          description="Create your first knowledge base article to help clients find answers on their own."
          actionLabel="New Article"
          onAction={handleNewArticle}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="bg-card-bg rounded-xl border border-border-warm p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {article.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      article.published
                        ? "bg-green-100 text-green-700"
                        : "bg-surface text-text-secondary"
                    }`}
                  >
                    {article.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-text-secondary capitalize">
                  {article.category.replace("-", " ")}
                </p>
              </div>

              <div className="flex items-center gap-1 ml-4 shrink-0">
                <button
                  onClick={() => handleEdit(article)}
                  className="p-1.5 rounded-md text-text-secondary hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(article.id)}
                  className="p-1.5 rounded-md text-text-secondary hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article form SlideOver */}
      <SlideOver
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditArticle(undefined);
        }}
        title={editArticle ? "Edit Article" : "New Article"}
      >
        <form onSubmit={handleSubmit} className="space-y-1">
          <FormField label="Title" required error={errors.title}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to reset your password"
              className="w-full px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </FormField>

          <FormField label="Category">
            <SelectField
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORY_OPTIONS}
            />
          </FormField>

          <FormField label="Content" required error={errors.content}>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the article content..."
              rows={12}
            />
          </FormField>

          <FormField label="Published">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 rounded border-border-warm text-brand focus:ring-brand/20"
              />
              <span className="text-sm text-foreground">
                Make this article visible to clients
              </span>
            </label>
          </FormField>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditArticle(undefined);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editArticle ? "Save Changes" : "Create Article"}
            </Button>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${articleToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
