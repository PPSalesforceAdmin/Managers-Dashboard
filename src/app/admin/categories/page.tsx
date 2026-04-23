import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/server/audit";
import { requireAdmin } from "@/server/session";

export default async function CategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { reports: true } } },
  });

  async function createCategory(formData: FormData): Promise<void> {
    "use server";
    const admin = await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const sortOrder = Number(formData.get("sortOrder") ?? 0);
    if (!name) return;
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) return;
    const created = await prisma.category.create({
      data: { name, description, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 },
    });
    await logAuditEvent({
      userId: admin.id,
      action: "admin_category_create",
      targetId: created.id,
    });
    revalidatePath("/admin/categories");
  }

  async function deleteCategory(formData: FormData): Promise<void> {
    "use server";
    const admin = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await prisma.category.delete({ where: { id } });
    await logAuditEvent({
      userId: admin.id,
      action: "admin_category_delete",
      targetId: id,
    });
    revalidatePath("/admin/categories");
  }

  async function renameCategory(formData: FormData): Promise<void> {
    "use server";
    const admin = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const sortOrder = Number(formData.get("sortOrder") ?? 0);
    if (!id || !name) return;
    await prisma.category.update({
      where: { id },
      data: { name, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 },
    });
    await logAuditEvent({
      userId: admin.id,
      action: "admin_category_update",
      targetId: id,
    });
    revalidatePath("/admin/categories");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-pp-navy">Categories</h1>
        <p className="mt-1 text-sm text-pp-body/80">
          Group reports on the landing page. Lower sort order appears first.
        </p>
      </div>

      <form
        action={createCategory}
        className="grid gap-3 rounded-pp-card bg-white shadow-pp-card-very-soft p-4 md:grid-cols-[2fr_3fr_1fr_auto]"
      >
        <input
          name="name"
          placeholder="Name"
          required
          className="rounded-pp-button border border-black/10 px-3 py-2"
        />
        <input
          name="description"
          placeholder="Description (optional)"
          className="rounded-pp-button border border-black/10 px-3 py-2"
        />
        <input
          name="sortOrder"
          type="number"
          defaultValue={0}
          className="rounded-pp-button border border-black/10 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-pp-button-lg bg-pp-orange px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
        >
          Add
        </button>
      </form>

      <div className="overflow-hidden rounded-pp-card bg-white shadow-pp-card-very-soft">
        <table className="w-full text-sm">
          <thead className="bg-pp-offwhite text-left text-xs uppercase tracking-pp-nav text-pp-body/60">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Sort</th>
              <th className="px-4 py-2">Reports</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-pp-body/60">
                  No categories yet.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-t border-black/5">
                  <td className="px-4 py-2">
                    <form action={renameCategory} className="flex gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        name="name"
                        defaultValue={c.name}
                        className="flex-1 rounded-pp-button border border-black/10 px-2 py-1"
                      />
                      <input
                        name="sortOrder"
                        type="number"
                        defaultValue={c.sortOrder}
                        className="w-16 rounded-pp-button border border-black/10 px-2 py-1"
                      />
                      <button
                        type="submit"
                        className="rounded-pp-button border border-black/10 px-2 py-1 hover:bg-pp-offwhite"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2 text-pp-body/60">{c.sortOrder}</td>
                  <td className="px-4 py-2 text-pp-body/60">{c._count.reports}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteCategory} className="inline">
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        disabled={c._count.reports > 0}
                        title={
                          c._count.reports > 0
                            ? "Can't delete: category has reports"
                            : undefined
                        }
                        className="rounded-pp-button border border-red-200 px-2 py-1 text-red-600 enabled:hover:bg-red-50 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
