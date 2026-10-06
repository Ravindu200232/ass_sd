import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Group() {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    group_name: "",
    description: "",
    status: "active",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data.data || []);
    } catch {
      toast.error("Failed to load groups");
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({ group_name: "", description: "", status: "active" });
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.group_name.trim()) {
      toast.error("Group name required");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/groups/${editingId}`, form);
        toast.success("Group updated");
      } else {
        await api.post("/groups", form);
        toast.success("Group created");
      }
      resetForm();
      loadGroups();
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const editGroup = (group) => {
    setEditingId(group.id);
    setForm({
      group_name: group.group_name,
      description: group.description || "",
      status: group.status || "active",
    });
  };

  const deleteGroup = async (id) => {
    if (!confirm("Delete this group?")) return;

    try {
      await api.delete(`/groups/${id}`);
      toast.success("Group deleted");
      loadGroups();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Create / Edit */}
      <Card>
        <CardHeader className="font-semibold">
          {editingId ? "Edit Group" : "Create Group"}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Input
            placeholder="Group name"
            value={form.group_name}
            onChange={(e) => handleChange("group_name", e.target.value)}
          />
          <Input
            placeholder="Description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="flex gap-2 col-span-full">
            <Button onClick={submit} disabled={loading}>
              {editingId ? "Update" : "Create"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="font-semibold">All Groups</CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-t">
                  <td className="p-2">{g.group_name}</td>
                  <td className="p-2 text-center">{g.status}</td>
                  <td className="p-2 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => editGroup(g)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteGroup(g.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-muted-foreground">
                    No groups found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
