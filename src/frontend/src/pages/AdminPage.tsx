import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { Ban, CheckCircle, Eye, Pin, Plus, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BlogRole } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import {
  useAddCategory,
  useBlockUser,
  useCategories,
  useDeleteCategory,
  useDeletePost,
  useListUsers,
  usePinPost,
  usePosts,
  usePublishPost,
  useUpdateUserRole,
} from "../hooks/useQueries";

export default function AdminPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin =
    currentUser?.profile.blogRole === BlogRole.superadmin ||
    currentUser?.profile.blogRole === BlogRole.moderator;

  if (!currentUser || !isAdmin) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-2xl mb-2">Åtkomst nekad</h1>
        <p className="text-muted-foreground mb-4">
          Du har inte behörighet att se adminpanelen.
        </p>
        <Button
          onClick={() => navigate({ to: "/" })}
          data-ocid="admin.back.button"
        >
          Tillbaka
        </Button>
      </main>
    );
  }

  return (
    <main
      className="container mx-auto px-4 py-8 max-w-6xl"
      data-ocid="admin.section"
    >
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-display text-3xl text-foreground">Adminpanel</h1>
          <p className="text-sm text-muted-foreground">
            {currentUser.profile.blogRole === BlogRole.superadmin
              ? "Superadmin"
              : "Moderator"}
          </p>
        </div>
      </div>
      <Tabs defaultValue="users" data-ocid="admin.tab">
        <TabsList className="mb-6">
          <TabsTrigger value="users" data-ocid="admin.users.tab">
            Användare
          </TabsTrigger>
          {currentUser.profile.blogRole === BlogRole.superadmin && (
            <TabsTrigger value="categories" data-ocid="admin.categories.tab">
              Kategorier
            </TabsTrigger>
          )}
          <TabsTrigger value="posts" data-ocid="admin.posts.tab">
            Inlägg
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersTab
            isSuperAdmin={currentUser.profile.blogRole === BlogRole.superadmin}
          />
        </TabsContent>
        {currentUser.profile.blogRole === BlogRole.superadmin && (
          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
        )}
        <TabsContent value="posts">
          <PostsTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function UsersTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { data: users, isLoading } = useListUsers();
  const updateRoleMutation = useUpdateUserRole();
  const blockMutation = useBlockUser();

  if (isLoading)
    return (
      <div data-ocid="admin.users.loading_state">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full mb-2" />
        ))}
      </div>
    );

  return (
    <div data-ocid="admin.users.table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alias</TableHead>
            <TableHead>Roll</TableHead>
            <TableHead>Status</TableHead>
            {isSuperAdmin && <TableHead>Ändra roll</TableHead>}
            <TableHead>Åtgärd</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(users ?? []).map((user, i) => (
            <TableRow key={user.alias} data-ocid={`admin.users.row.${i + 1}`}>
              <TableCell className="font-medium">{user.alias}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {user.blogRole === BlogRole.superadmin
                    ? "Superadmin"
                    : user.blogRole === BlogRole.moderator
                      ? "Moderator"
                      : "Användare"}
                </Badge>
              </TableCell>
              <TableCell>
                {user.isBlocked ? (
                  <Badge variant="destructive">Blockerad</Badge>
                ) : (
                  <Badge variant="secondary">Aktiv</Badge>
                )}
              </TableCell>
              {isSuperAdmin && (
                <TableCell>
                  <Select
                    value={user.blogRole}
                    onValueChange={(val) =>
                      updateRoleMutation.mutate(
                        { userId: user.alias, newRole: val as BlogRole },
                        {
                          onSuccess: () => toast.success("Roll uppdaterad"),
                          onError: () => toast.error("Fel"),
                        },
                      )
                    }
                  >
                    <SelectTrigger
                      className="w-36"
                      data-ocid={`admin.users.role.select.${i + 1}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BlogRole.user}>Användare</SelectItem>
                      <SelectItem value={BlogRole.moderator}>
                        Moderator
                      </SelectItem>
                      <SelectItem value={BlogRole.superadmin}>
                        Superadmin
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              )}
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    blockMutation.mutate(
                      { userId: user.alias, block: !user.isBlocked },
                      {
                        onSuccess: () =>
                          toast.success(
                            user.isBlocked ? "Avblockerad" : "Blockerad",
                          ),
                        onError: () => toast.error("Fel"),
                      },
                    )
                  }
                  data-ocid={`admin.users.block.button.${i + 1}`}
                  className={
                    user.isBlocked ? "text-green-600" : "text-destructive"
                  }
                >
                  {user.isBlocked ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Avblockera
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-1" />
                      Blockera
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {(users ?? []).length === 0 && (
        <p
          className="text-center py-8 text-muted-foreground text-sm"
          data-ocid="admin.users.empty_state"
        >
          Inga användare hittades.
        </p>
      )}
    </div>
  );
}

function CategoriesTab() {
  const { data: categories, isLoading } = useCategories();
  const addMutation = useAddCategory();
  const deleteMutation = useDeleteCategory();
  const [newCat, setNewCat] = useState("");

  const handleAdd = async () => {
    if (!newCat.trim()) return;
    try {
      await addMutation.mutateAsync(newCat.trim());
      setNewCat("");
      toast.success("Kategori tillagd");
    } catch {
      toast.error("Kunde inte lägga till kategori");
    }
  };

  return (
    <div data-ocid="admin.categories.section">
      <div className="flex items-center gap-2 mb-6">
        <Input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Ny kategori..."
          className="max-w-xs"
          data-ocid="admin.categories.input"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button
          onClick={handleAdd}
          disabled={addMutation.isPending}
          data-ocid="admin.categories.add.button"
        >
          <Plus className="h-4 w-4 mr-1" />
          Lägg till
        </Button>
      </div>
      {isLoading ? (
        <div data-ocid="admin.categories.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(categories ?? []).map((cat, i) => (
            <div
              key={cat.id}
              data-ocid={`admin.categories.item.${i + 1}`}
              className="flex items-center justify-between bg-secondary/40 rounded-lg px-4 py-3"
            >
              <span className="font-medium">{cat.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  deleteMutation.mutate(cat.id, {
                    onSuccess: () => toast.success("Kategori borttagen"),
                    onError: () => toast.error("Kunde inte ta bort"),
                  })
                }
                data-ocid={`admin.categories.delete_button.${i + 1}`}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(categories ?? []).length === 0 && (
            <p
              className="text-center py-8 text-muted-foreground text-sm"
              data-ocid="admin.categories.empty_state"
            >
              Inga kategorier ännu.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PostsTab() {
  const { data: posts, isLoading } = usePosts();
  const deleteMutation = useDeletePost();
  const publishMutation = usePublishPost();
  const pinMutation = usePinPost();
  const { data: categories } = useCategories();

  if (isLoading)
    return (
      <div data-ocid="admin.posts.loading_state">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full mb-2" />
        ))}
      </div>
    );

  return (
    <div data-ocid="admin.posts.table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titel</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Författare</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Åtgärder</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(posts ?? []).map((post, i) => {
            const cat = (categories ?? []).find(
              (c) => c.id === post.categoryId,
            );
            return (
              <TableRow key={post.id} data-ocid={`admin.posts.row.${i + 1}`}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {post.title}
                </TableCell>
                <TableCell>{cat?.name ?? "-"}</TableCell>
                <TableCell>{post.authorId}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Badge
                      variant={post.isPublished ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {post.isPublished ? "Publicerat" : "Utkast"}
                    </Badge>
                    {post.isPinned && (
                      <Badge className="text-xs bg-primary/20 text-primary border-0">
                        Nålat
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title={post.isPublished ? "Avpublicera" : "Publicera"}
                      onClick={() =>
                        publishMutation.mutate(post.id, {
                          onSuccess: () => toast.success("Status ändrad"),
                          onError: () => toast.error("Fel"),
                        })
                      }
                      data-ocid={`admin.posts.publish.button.${i + 1}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title={post.isPinned ? "Avnåla" : "Nåla"}
                      onClick={() =>
                        pinMutation.mutate(post.id, {
                          onSuccess: () =>
                            toast.success(post.isPinned ? "Avnålat" : "Nålat"),
                          onError: () => toast.error("Fel"),
                        })
                      }
                      data-ocid={`admin.posts.pin.button.${i + 1}`}
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Ta bort inlägg?"))
                          deleteMutation.mutate(post.id, {
                            onSuccess: () => toast.success("Borttaget"),
                            onError: () => toast.error("Fel"),
                          });
                      }}
                      data-ocid={`admin.posts.delete_button.${i + 1}`}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {(posts ?? []).length === 0 && (
        <p
          className="text-center py-8 text-muted-foreground text-sm"
          data-ocid="admin.posts.empty_state"
        >
          Inga inlägg hittades.
        </p>
      )}
    </div>
  );
}
