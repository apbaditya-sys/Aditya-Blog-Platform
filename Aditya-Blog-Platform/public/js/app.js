let posts = [];
let authMode = "login";
let currentPost = null;

const $ = id => document.getElementById(id);
const token = () => localStorage.getItem("aditya_blog_token");
const user = () => {
  try { return JSON.parse(localStorage.getItem("aditya_blog_user") || "null"); }
  catch { return null; }
};

async function api(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2200);
}

function openModal(id) { $(id).classList.add("show"); }
function closeModal(id) { $(id).classList.remove("show"); }
window.closeModal = closeModal;

function formatDate(v) {
  return new Date(v).toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" });
}

function updateNav() {
  const u = user();
  if (u) {
    $("profileChip").style.display = "flex";
    $("profileName").textContent = u.name;
    $("avatar").textContent = (u.name || "A")[0].toUpperCase();
    $("authBtn").textContent = "Logout";
  } else {
    $("profileChip").style.display = "none";
    $("authBtn").textContent = "Login";
  }
}

async function loadPosts() {
  try {
    posts = await api("/api/posts");
    renderPosts();
    $("postStat").textContent = posts.length;
    $("commentStat").textContent = posts.reduce((n,p) => n + Number(p.comment_count || 0), 0);
  } catch (err) {
    $("postsGrid").innerHTML = `<div class="empty">Could not load posts.<br>${err.message}</div>`;
  }
}

function renderPosts() {
  const q = $("searchInput").value.trim().toLowerCase();
  const cat = $("categoryFilter").value;

  const filtered = posts.filter(p => {
    const hay = `${p.title} ${p.author} ${p.category} ${p.excerpt || ""}`.toLowerCase();
    return (!q || hay.includes(q)) && (!cat || p.category === cat);
  });

  if (!filtered.length) {
    $("postsGrid").innerHTML = `<div class="empty">No stories found. Try another search or publish the first one.</div>`;
    return;
  }

  $("postsGrid").innerHTML = filtered.map(p => `
    <article class="post-card">
      <div class="post-cover">${escapeHtml(p.cover_emoji || "✍️")}</div>
      <div class="post-body">
        <span class="badge">${escapeHtml(p.category || "General")}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.excerpt || p.content.slice(0,120))}</p>
        <div class="meta">
          <span>By ${escapeHtml(p.author)}</span>
          <span>${formatDate(p.created_at)}</span>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="openPost(${p.id})">Read</button>
          <button class="btn btn-ghost" onclick="quickLike(${p.id})">♡ ${p.likes}</button>
          <button class="btn btn-ghost" onclick="openPost(${p.id})">💬 ${p.comment_count}</button>
        </div>
      </div>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function openAuth(mode="login") {
  authMode = mode;
  $("authTitle").textContent = mode === "login" ? "Welcome back" : "Create your account";
  $("authSubmit").textContent = mode === "login" ? "Login" : "Register";
  $("switchAuth").textContent = mode === "login" ? "New here? Create account" : "Already registered? Login";
  $("nameWrap").style.display = mode === "register" ? "block" : "none";
  openModal("authModal");
}

async function submitAuth() {
  try {
    const payload = {
      email: $("authEmail").value.trim(),
      password: $("authPassword").value
    };
    if (authMode === "register") payload.name = $("authName").value.trim();

    const data = await api(`/api/auth/${authMode}`, {
      method:"POST",
      body:JSON.stringify(payload)
    });

    localStorage.setItem("aditya_blog_token", data.token);
    localStorage.setItem("aditya_blog_user", JSON.stringify(data.user));
    closeModal("authModal");
    updateNav();
    toast(authMode === "login" ? "Welcome back!" : "Account created!");
  } catch (err) {
    toast(err.message);
  }
}

function openCreate(post = null) {
  if (!user()) {
    toast("Please login before writing a post.");
    openAuth("login");
    return;
  }
  $("editPostId").value = post ? post.id : "";
  $("editorTitle").textContent = post ? "Edit your post" : "Create a new post";
  $("publishBtn").textContent = post ? "Save Changes" : "Publish Post";
  $("postTitle").value = post?.title || "";
  $("postExcerpt").value = post?.excerpt || "";
  $("postContent").value = post?.content || "";
  $("postCategory").value = post?.category || "Technology";
  $("postEmoji").value = post?.cover_emoji || "✍️";
  openModal("createModal");
}
window.openCreate = openCreate;

async function publish() {
  const id = $("editPostId").value;
  const payload = {
    title:$("postTitle").value.trim(),
    excerpt:$("postExcerpt").value.trim(),
    content:$("postContent").value.trim(),
    category:$("postCategory").value,
    cover_emoji:$("postEmoji").value.trim() || "✍️"
  };

  try {
    if (!payload.title || !payload.content) return toast("Title and content are required.");
    await api(id ? `/api/posts/${id}` : "/api/posts", {
      method:id ? "PUT" : "POST",
      body:JSON.stringify(payload)
    });
    closeModal("createModal");
    toast(id ? "Post updated!" : "Post published!");
    await loadPosts();
    if (id && currentPost) openPost(Number(id));
  } catch (err) { toast(err.message); }
}

async function openPost(id) {
  try {
    const p = await api(`/api/posts/${id}`);
    currentPost = p;
    $("viewCategory").textContent = p.category;
    $("viewEmoji").textContent = p.cover_emoji || "✍️";
    $("viewTitle").textContent = p.title;
    $("viewMeta").textContent = `By ${p.author} • ${formatDate(p.created_at)} • ${p.likes} likes`;
    $("viewContent").textContent = p.content;

    const me = user();
    const own = me && Number(me.id) === Number(p.user_id);
    $("editBtn").style.display = own ? "inline-block" : "none";
    $("deleteBtn").style.display = own ? "inline-block" : "none";
    $("commentComposer").style.display = me ? "grid" : "none";
    $("commentsList").innerHTML = p.comments.length ? p.comments.map(c => `
      <div class="comment">
        <div class="comment-head">
          <span><strong>${escapeHtml(c.author)}</strong> • ${formatDate(c.created_at)}</span>
          ${me && Number(me.id) === Number(c.user_id) ? `<button class="btn btn-danger" style="padding:5px 9px" onclick="deleteComment(${c.id})">Delete</button>` : ""}
        </div>
        <p>${escapeHtml(c.comment)}</p>
      </div>
    `).join("") : `<div class="empty" style="margin-top:12px">No comments yet. Start the conversation.</div>`;

    openModal("viewModal");
  } catch (err) { toast(err.message); }
}
window.openPost = openPost;

async function quickLike(id) {
  try {
    const data = await api(`/api/posts/${id}/like`, { method:"POST" });
    toast(`Liked! ${data.likes} total likes`);
    await loadPosts();
  } catch (err) { toast(err.message); }
}
window.quickLike = quickLike;

async function addComment() {
  if (!currentPost) return;
  try {
    const comment = $("commentText").value.trim();
    if (!comment) return toast("Write a comment first.");
    await api(`/api/comments/post/${currentPost.id}`, {
      method:"POST",
      body:JSON.stringify({ comment })
    });
    $("commentText").value = "";
    toast("Comment posted!");
    await loadPosts();
    await openPost(currentPost.id);
  } catch (err) { toast(err.message); }
}

async function deleteComment(id) {
  try {
    await api(`/api/comments/${id}`, { method:"DELETE" });
    toast("Comment deleted.");
    await loadPosts();
    await openPost(currentPost.id);
  } catch (err) { toast(err.message); }
}
window.deleteComment = deleteComment;

async function deletePost() {
  if (!currentPost || !confirm("Delete this post permanently?")) return;
  try {
    await api(`/api/posts/${currentPost.id}`, { method:"DELETE" });
    closeModal("viewModal");
    toast("Post deleted.");
    currentPost = null;
    await loadPosts();
  } catch (err) { toast(err.message); }
}

$("authBtn").addEventListener("click", () => {
  if (user()) {
    localStorage.removeItem("aditya_blog_token");
    localStorage.removeItem("aditya_blog_user");
    updateNav();
    toast("Logged out.");
  } else openAuth("login");
});
$("createBtn").addEventListener("click", () => openCreate());
$("switchAuth").addEventListener("click", () => openAuth(authMode === "login" ? "register" : "login"));
$("authSubmit").addEventListener("click", submitAuth);
$("publishBtn").addEventListener("click", publish);
$("searchInput").addEventListener("input", renderPosts);
$("categoryFilter").addEventListener("change", renderPosts);
$("commentBtn").addEventListener("click", addComment);
$("likeBtn").addEventListener("click", async () => {
  if (!currentPost) return;
  await quickLike(currentPost.id);
  await openPost(currentPost.id);
});
$("editBtn").addEventListener("click", () => {
  if (!currentPost) return;
  closeModal("viewModal");
  openCreate(currentPost);
});
$("deleteBtn").addEventListener("click", deletePost);

document.querySelectorAll(".modal").forEach(m => m.addEventListener("click", e => {
  if (e.target === m) closeModal(m.id);
}));

updateNav();
loadPosts();
