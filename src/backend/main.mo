import Text "mo:core/Text";
import Set "mo:core/Set";
import List "mo:core/List";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Blob "mo:core/Blob";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import MixinStorage "blob-storage/Mixin";
import Iter "mo:core/Iter";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type BlogRole = { #superadmin; #moderator; #user };

  type User = {
    userId : Text;
    alias : Text;
    passwordHash : Blob;
    salt : Blob;
    blogRole : BlogRole;
    isBlocked : Bool;
  };

  type UserProfile = {
    alias : Text;
    blogRole : BlogRole;
    isBlocked : Bool;
  };

  type Post = {
    id : Text;
    title : Text;
    body : Text;
    authorId : Text;
    categoryId : Text;
    mediaUrls : [Storage.ExternalBlob];
    isPublished : Bool;
    isPinned : Bool;
    likes : Set.Set<Text>;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type PostView = {
    id : Text;
    title : Text;
    body : Text;
    authorId : Text;
    categoryId : Text;
    mediaUrls : [Storage.ExternalBlob];
    isPublished : Bool;
    isPinned : Bool;
    likes : [Text];
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type Comment = {
    id : Text;
    postId : Text;
    authorId : Text;
    text : Text;
    imageUrl : ?Storage.ExternalBlob;
    likes : Set.Set<Text>;
    createdAt : Time.Time;
  };

  type CommentView = {
    id : Text;
    postId : Text;
    authorId : Text;
    text : Text;
    imageUrl : ?Storage.ExternalBlob;
    likes : [Text];
    createdAt : Time.Time;
  };

  type Category = {
    id : Text;
    name : Text;
  };

  type CategoryView = {
    id : Text;
    name : Text;
    isHidden : Bool;
  };

  type CategoryPermission = {
    readAllowlist : [Text];
    commentAllowlist : [Text];
  };

  // Stable serialization types (no Set, use arrays)
  type StablePost = {
    id : Text;
    title : Text;
    body : Text;
    authorId : Text;
    categoryId : Text;
    mediaUrls : [Storage.ExternalBlob];
    isPublished : Bool;
    isPinned : Bool;
    likesArr : [Text];
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type StableComment = {
    id : Text;
    postId : Text;
    authorId : Text;
    text : Text;
    imageUrl : ?Storage.ExternalBlob;
    likesArr : [Text];
    createdAt : Time.Time;
  };

  type StableFollows = {
    userId : Text;
    following : [Text];
  };

  // ── Stable backing storage ──────────────────────────────────────────────────
  stable var stableUsers : [(Text, User)] = [];
  stable var stableUsersByAlias : [(Text, Text)] = [];
  stable var stablePosts : [(Text, StablePost)] = [];
  stable var stableComments : [(Text, StableComment)] = [];
  stable var stableCategories : [(Text, Category)] = [];
  stable var stableCategoryPermissions : [(Text, CategoryPermission)] = [];
  stable var stableHiddenCategories : [Text] = [];
  stable var stableFollows : [StableFollows] = [];
  stable var stableNextPostId : Nat = 0;
  stable var stableNextCommentId : Nat = 0;

  // ── Runtime state (restored from stable on startup) ─────────────────────────
  let users = Map.empty<Text, User>();
  let usersByAlias = Map.empty<Text, Text>();
  let sessions = Map.empty<Text, Text>();
  let posts = Map.empty<Text, Post>();
  let comments = Map.empty<Text, Comment>();
  let categories = Map.empty<Text, Category>();
  let follows = Map.empty<Text, Set.Set<Text>>();
  let categoryPermissions = Map.empty<Text, CategoryPermission>();
  let hiddenCategoriesSet = Set.empty<Text>();

  var nextPostId : Nat = stableNextPostId;
  var nextCommentId : Nat = stableNextCommentId;

  // Restore runtime state from stable arrays
  for ((k, v) in stableUsers.vals()) { users.add(k, v) };
  for ((k, v) in stableUsersByAlias.vals()) { usersByAlias.add(k, v) };
  for ((k, sp) in stablePosts.vals()) {
    let likesSet = Set.empty<Text>();
    for (l in sp.likesArr.vals()) { likesSet.add(l) };
    let post : Post = {
      id = sp.id; title = sp.title; body = sp.body;
      authorId = sp.authorId; categoryId = sp.categoryId;
      mediaUrls = sp.mediaUrls; isPublished = sp.isPublished;
      isPinned = sp.isPinned; likes = likesSet;
      createdAt = sp.createdAt; updatedAt = sp.updatedAt;
    };
    posts.add(k, post);
  };
  for ((k, sc) in stableComments.vals()) {
    let likesSet = Set.empty<Text>();
    for (l in sc.likesArr.vals()) { likesSet.add(l) };
    let comment : Comment = {
      id = sc.id; postId = sc.postId; authorId = sc.authorId;
      text = sc.text; imageUrl = sc.imageUrl; likes = likesSet;
      createdAt = sc.createdAt;
    };
    comments.add(k, comment);
  };
  for ((k, v) in stableCategories.vals()) { categories.add(k, v) };
  for ((k, v) in stableCategoryPermissions.vals()) { categoryPermissions.add(k, v) };
  for (id in stableHiddenCategories.vals()) { hiddenCategoriesSet.add(id) };
  for (sf in stableFollows.vals()) {
    let followSet = Set.empty<Text>();
    for (f in sf.following.vals()) { followSet.add(f) };
    follows.add(sf.userId, followSet);
  };

  // Initialize default categories only if none exist
  func initCategories() {
    if (categories.size() == 0) {
      let defaultCategories = ["Teknik", "Livsstil", "Nyheter", "Världen", "Natur", "Livsberättelser"];
      for (name in defaultCategories.vals()) {
        let cat : Category = { id = name; name = name };
        categories.add(name, cat);
      };
    };
  };
  initCategories();

  // ── Upgrade hooks ───────────────────────────────────────────────────────────
  system func preupgrade() {
    stableNextPostId := nextPostId;
    stableNextCommentId := nextCommentId;
    stableUsers := users.entries().toArray();
    stableUsersByAlias := usersByAlias.entries().toArray();
    stableCategories := categories.entries().toArray();
    stableCategoryPermissions := categoryPermissions.entries().toArray();
    stableHiddenCategories := hiddenCategoriesSet.toArray();

    let postsArr = List.empty<(Text, StablePost)>();
    for ((k, p) in posts.entries()) {
      let sp : StablePost = {
        id = p.id; title = p.title; body = p.body;
        authorId = p.authorId; categoryId = p.categoryId;
        mediaUrls = p.mediaUrls; isPublished = p.isPublished;
        isPinned = p.isPinned; likesArr = p.likes.toArray();
        createdAt = p.createdAt; updatedAt = p.updatedAt;
      };
      postsArr.add((k, sp));
    };
    stablePosts := postsArr.toArray();

    let commentsArr = List.empty<(Text, StableComment)>();
    for ((k, c) in comments.entries()) {
      let sc : StableComment = {
        id = c.id; postId = c.postId; authorId = c.authorId;
        text = c.text; imageUrl = c.imageUrl; likesArr = c.likes.toArray();
        createdAt = c.createdAt;
      };
      commentsArr.add((k, sc));
    };
    stableComments := commentsArr.toArray();

    let followsArr = List.empty<StableFollows>();
    for ((userId, followSet) in follows.entries()) {
      followsArr.add({ userId; following = followSet.toArray() });
    };
    stableFollows := followsArr.toArray();
  };

  system func postupgrade() {
    // Clear stable arrays to free memory (data is already in runtime maps)
    stableUsers := [];
    stableUsersByAlias := [];
    stablePosts := [];
    stableComments := [];
    stableCategories := [];
    stableCategoryPermissions := [];
    stableHiddenCategories := [];
    stableFollows := [];
  };

  // ── Helper functions ────────────────────────────────────────────────────────
  func isSuperadmin(caller : Principal) : Bool {
    let userId = caller.toText();
    switch (users.get(userId)) {
      case (?user) { user.blogRole == #superadmin };
      case (null) { false };
    };
  };

  func isModerator(caller : Principal) : Bool {
    let userId = caller.toText();
    switch (users.get(userId)) {
      case (?user) {
        user.blogRole == #superadmin or user.blogRole == #moderator
      };
      case (null) { false };
    };
  };

  func isRegisteredUser(caller : Principal) : Bool {
    let userId = caller.toText();
    switch (users.get(userId)) {
      case (?user) { not user.isBlocked };
      case (null) { false };
    };
  };

  func getCallerAlias(caller : Principal) : ?Text {
    let userId = caller.toText();
    switch (users.get(userId)) {
      case (?user) { ?user.alias };
      case (null) { null };
    };
  };

  func arrayContainsText(arr : [Text], value : Text) : Bool {
    for (item in arr.vals()) {
      if (item == value) { return true };
    };
    false;
  };

  func canReadCategory(callerAlias : ?Text, categoryId : Text) : Bool {
    switch (categoryPermissions.get(categoryId)) {
      case (?perm) {
        if (perm.readAllowlist.size() == 0) { return true };
        switch (callerAlias) {
          case (?alias) { arrayContainsText(perm.readAllowlist, alias) };
          case (null) { false };
        };
      };
      case (null) { true };
    };
  };

  func canCommentCategory(callerAlias : ?Text, categoryId : Text) : Bool {
    switch (categoryPermissions.get(categoryId)) {
      case (?perm) {
        if (perm.commentAllowlist.size() == 0) { return true };
        switch (callerAlias) {
          case (?alias) { arrayContainsText(perm.commentAllowlist, alias) };
          case (null) { false };
        };
      };
      case (null) { true };
    };
  };

  // ── User management ─────────────────────────────────────────────────────────

  public shared ({ caller }) func register(alias : Text, passwordHash : Blob, salt : Blob) : async Text {
    let userId = caller.toText();
    switch (users.get(userId)) {
      case (?_) { Runtime.trap("User already registered") };
      case (null) {};
    };
    switch (usersByAlias.get(alias)) {
      case (?_) { Runtime.trap("Alias already in use") };
      case (null) {};
    };
    let blogRole : BlogRole = if (users.size() == 0) #superadmin else #user;
    let user : User = { userId; alias; passwordHash; salt; blogRole; isBlocked = false };
    users.add(userId, user);
    usersByAlias.add(alias, userId);
    let token = userId # "-" # Time.now().toText();
    sessions.add(token, userId);
    token;
  };

  public shared ({ caller }) func login(passwordHash : Blob) : async Text {
    let userId = caller.toText();
    switch (users.get(userId)) {
      case (?user) {
        if (user.isBlocked) { Runtime.trap("User is blocked") };
        let token = userId # "-" # Time.now().toText();
        sessions.add(token, userId);
        token;
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func deleteAccount() : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can delete their account");
    };
    let userId = caller.toText();
    switch (users.get(userId)) {
      case (?user) {
        usersByAlias.remove(user.alias);
        users.remove(userId);
      };
      case (null) {};
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    let userId = caller.toText();
    switch (users.get(userId)) {
      case (?user) {
        ?{ alias = user.alias; blogRole = user.blogRole; isBlocked = user.isBlocked };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getUserProfile(userId : Text) : async ?UserProfile {
    switch (users.get(userId)) {
      case (?user) {
        ?{ alias = user.alias; blogRole = user.blogRole; isBlocked = user.isBlocked };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can save profiles");
    };
    let userId = caller.toText();
    switch (users.get(userId)) {
      case (?user) {
        let updatedUser : User = {
          userId = user.userId; alias = profile.alias;
          passwordHash = user.passwordHash; salt = user.salt;
          blogRole = user.blogRole; isBlocked = user.isBlocked;
        };
        users.add(userId, updatedUser);
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public query ({ caller }) func getProfile() : async ?UserProfile {
    let userId = caller.toText();
    switch (users.get(userId)) {
      case (?user) {
        ?{ alias = user.alias; blogRole = user.blogRole; isBlocked = user.isBlocked };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func listUsers() : async [UserProfile] {
    if (not isSuperadmin(caller)) {
      Runtime.trap("Unauthorized: Only superadmins can list all users");
    };
    users.values().toArray().map(func(user) {
      { alias = user.alias; blogRole = user.blogRole; isBlocked = user.isBlocked }
    });
  };

  public shared ({ caller }) func updateUserRole(userId : Text, newRole : BlogRole) : async () {
    if (not isSuperadmin(caller)) {
      Runtime.trap("Unauthorized: Only superadmins can update user roles");
    };
    switch (users.get(userId)) {
      case (?user) {
        let updatedUser : User = {
          userId = user.userId; alias = user.alias;
          passwordHash = user.passwordHash; salt = user.salt;
          blogRole = newRole; isBlocked = user.isBlocked;
        };
        users.add(userId, updatedUser);
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func blockUser(userId : Text) : async () {
    if (not isModerator(caller)) {
      Runtime.trap("Unauthorized: Only moderators and superadmins can block users");
    };
    switch (users.get(userId)) {
      case (?user) {
        let updatedUser : User = {
          userId = user.userId; alias = user.alias;
          passwordHash = user.passwordHash; salt = user.salt;
          blogRole = user.blogRole; isBlocked = true;
        };
        users.add(userId, updatedUser);
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func unblockUser(userId : Text) : async () {
    if (not isModerator(caller)) {
      Runtime.trap("Unauthorized: Only moderators and superadmins can unblock users");
    };
    switch (users.get(userId)) {
      case (?user) {
        let updatedUser : User = {
          userId = user.userId; alias = user.alias;
          passwordHash = user.passwordHash; salt = user.salt;
          blogRole = user.blogRole; isBlocked = false;
        };
        users.add(userId, updatedUser);
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  // ── Posts ───────────────────────────────────────────────────────────────────

  public shared ({ caller }) func createPost(title : Text, body : Text, categoryId : Text, mediaUrls : [Storage.ExternalBlob]) : async Text {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can create posts");
    };
    let userId = caller.toText();
    let postId = nextPostId.toText();
    nextPostId += 1;
    let post : Post = {
      id = postId; title; body; authorId = userId; categoryId; mediaUrls;
      isPublished = false; isPinned = false; likes = Set.empty<Text>();
      createdAt = Time.now(); updatedAt = Time.now();
    };
    posts.add(postId, post);
    postId;
  };

  public shared ({ caller }) func editPost(postId : Text, title : Text, body : Text, categoryId : Text, mediaUrls : [Storage.ExternalBlob]) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can edit posts");
    };
    let userId = caller.toText();
    switch (posts.get(postId)) {
      case (?post) {
        if (post.authorId != userId and not isModerator(caller)) {
          Runtime.trap("Unauthorized: Only the author or moderators can edit this post");
        };
        let updatedPost : Post = {
          id = post.id; title; body; authorId = post.authorId; categoryId; mediaUrls;
          isPublished = post.isPublished; isPinned = post.isPinned; likes = post.likes;
          createdAt = post.createdAt; updatedAt = Time.now();
        };
        posts.add(postId, updatedPost);
      };
      case (null) { Runtime.trap("Post not found") };
    };
  };

  public shared ({ caller }) func deletePost(postId : Text) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can delete posts");
    };
    let userId = caller.toText();
    switch (posts.get(postId)) {
      case (?post) {
        if (post.authorId != userId and not isModerator(caller)) {
          Runtime.trap("Unauthorized: Only the author or moderators can delete this post");
        };
        posts.remove(postId);
      };
      case (null) { Runtime.trap("Post not found") };
    };
  };

  public shared ({ caller }) func publishPost(postId : Text) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can publish posts");
    };
    let userId = caller.toText();
    switch (posts.get(postId)) {
      case (?post) {
        if (post.authorId != userId) {
          Runtime.trap("Unauthorized: Only the author can publish this post");
        };
        let updatedPost : Post = {
          id = post.id; title = post.title; body = post.body;
          authorId = post.authorId; categoryId = post.categoryId;
          mediaUrls = post.mediaUrls; isPublished = true; isPinned = post.isPinned;
          likes = post.likes; createdAt = post.createdAt; updatedAt = Time.now();
        };
        posts.add(postId, updatedPost);
      };
      case (null) { Runtime.trap("Post not found") };
    };
  };

  public shared ({ caller }) func pinPost(postId : Text) : async () {
    if (not isSuperadmin(caller)) {
      Runtime.trap("Unauthorized: Only superadmins can pin posts");
    };
    switch (posts.get(postId)) {
      case (?post) {
        let updatedPost : Post = {
          id = post.id; title = post.title; body = post.body;
          authorId = post.authorId; categoryId = post.categoryId;
          mediaUrls = post.mediaUrls; isPublished = post.isPublished; isPinned = true;
          likes = post.likes; createdAt = post.createdAt; updatedAt = Time.now();
        };
        posts.add(postId, updatedPost);
      };
      case (null) { Runtime.trap("Post not found") };
    };
  };

  public shared ({ caller }) func likePost(postId : Text) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can like posts");
    };
    let userId = caller.toText();
    switch (posts.get(postId)) {
      case (?post) {
        post.likes.add(userId);
        posts.add(postId, post);
      };
      case (null) { Runtime.trap("Post not found") };
    };
  };

  public shared ({ caller }) func unlikePost(postId : Text) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can unlike posts");
    };
    let userId = caller.toText();
    switch (posts.get(postId)) {
      case (?post) {
        post.likes.remove(userId);
        posts.add(postId, post);
      };
      case (null) { Runtime.trap("Post not found") };
    };
  };

  func postToPostView(post : Post) : PostView {
    {
      id = post.id; title = post.title; body = post.body;
      authorId = post.authorId; categoryId = post.categoryId;
      mediaUrls = post.mediaUrls; isPublished = post.isPublished;
      isPinned = post.isPinned; likes = post.likes.toArray();
      createdAt = post.createdAt; updatedAt = post.updatedAt;
    };
  };

  public query ({ caller }) func getPosts() : async [PostView] {
    let alias = getCallerAlias(caller);
    let allPosts = posts.values().toArray();
    allPosts.filter(func(post) { canReadCategory(alias, post.categoryId) }).map(postToPostView);
  };

  public query ({ caller }) func getPost(postId : Text) : async ?PostView {
    let alias = getCallerAlias(caller);
    switch (posts.get(postId)) {
      case (?post) {
        if (not canReadCategory(alias, post.categoryId)) { return null };
        ?postToPostView(post);
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getPostsByCategory(categoryId : Text) : async [PostView] {
    let alias = getCallerAlias(caller);
    if (not canReadCategory(alias, categoryId)) { return [] };
    posts.values().toArray()
      .filter(func(post) { post.categoryId == categoryId })
      .map(postToPostView);
  };

  public query ({ caller }) func getPostsByAuthor(authorId : Text) : async [PostView] {
    let alias = getCallerAlias(caller);
    posts.values().toArray()
      .filter(func(post) { post.authorId == authorId and canReadCategory(alias, post.categoryId) })
      .map(postToPostView);
  };

  public query ({ caller }) func getFollowingFeed() : async [PostView] {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can view their feed");
    };
    let userId = caller.toText();
    let alias = getCallerAlias(caller);
    let followingArray = switch (follows.get(userId)) {
      case (?fs) { fs.toArray() };
      case (null) { [] };
    };
    func isFollowing(authorId : Text) : Bool {
      for (u in followingArray.vals()) { if (u == authorId) return true };
      false;
    };
    posts.values().toArray()
      .filter(func(post) { isFollowing(post.authorId) and canReadCategory(alias, post.categoryId) })
      .map(postToPostView);
  };

  // ── Comments ────────────────────────────────────────────────────────────────

  public shared ({ caller }) func addComment(postId : Text, text : Text, imageUrl : ?Storage.ExternalBlob) : async Text {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can add comments");
    };
    let alias = getCallerAlias(caller);
    switch (posts.get(postId)) {
      case (?post) {
        if (not canCommentCategory(alias, post.categoryId)) {
          Runtime.trap("Unauthorized: You don't have permission to comment in this category");
        };
      };
      case (null) { Runtime.trap("Post not found") };
    };
    let userId = caller.toText();
    let commentId = nextCommentId.toText();
    nextCommentId += 1;
    let comment : Comment = {
      id = commentId; postId; authorId = userId; text; imageUrl;
      likes = Set.empty<Text>(); createdAt = Time.now();
    };
    comments.add(commentId, comment);
    commentId;
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can delete comments");
    };
    let userId = caller.toText();
    switch (comments.get(commentId)) {
      case (?comment) {
        if (comment.authorId != userId and not isModerator(caller)) {
          Runtime.trap("Unauthorized: Only the author or moderators can delete this comment");
        };
        comments.remove(commentId);
      };
      case (null) { Runtime.trap("Comment not found") };
    };
  };

  public shared ({ caller }) func likeComment(commentId : Text) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can like comments");
    };
    let userId = caller.toText();
    switch (comments.get(commentId)) {
      case (?comment) {
        comment.likes.add(userId);
        comments.add(commentId, comment);
      };
      case (null) { Runtime.trap("Comment not found") };
    };
  };

  func commentToCommentView(comment : Comment) : CommentView {
    {
      id = comment.id; postId = comment.postId; authorId = comment.authorId;
      text = comment.text; imageUrl = comment.imageUrl;
      likes = comment.likes.toArray(); createdAt = comment.createdAt;
    };
  };

  public query ({ caller }) func getCommentsForPost(postId : Text) : async [CommentView] {
    comments.values().toArray()
      .filter(func(comment) { comment.postId == postId })
      .map(commentToCommentView);
  };

  // ── Categories ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func addCategory(name : Text, isHidden : Bool) : async () {
    if (not isSuperadmin(caller)) {
      Runtime.trap("Unauthorized: Only superadmins can add categories");
    };
    categories.add(name, { id = name; name = name });
    if (isHidden) { hiddenCategoriesSet.add(name) };
  };

  public shared ({ caller }) func deleteCategory(categoryId : Text) : async () {
    if (not isSuperadmin(caller)) {
      Runtime.trap("Unauthorized: Only superadmins can delete categories");
    };
    categories.remove(categoryId);
    categoryPermissions.remove(categoryId);
  };

  public query ({ caller }) func getCategories() : async [CategoryView] {
    categories.values().toArray().map(func(cat : Category) : CategoryView {
      { id = cat.id; name = cat.name; isHidden = hiddenCategoriesSet.contains(cat.id) }
    });
  };

  public shared ({ caller }) func setCategoryVisibility(categoryId : Text, isHidden : Bool) : async () {
    if (not isSuperadmin(caller)) {
      Runtime.trap("Unauthorized: Only superadmins can set category visibility");
    };
    if (isHidden) { hiddenCategoriesSet.add(categoryId) }
    else { hiddenCategoriesSet.remove(categoryId) };
  };

  // ── Category permissions ────────────────────────────────────────────────────

  public query ({ caller }) func getCategoryPermissions(categoryId : Text) : async CategoryPermission {
    switch (categoryPermissions.get(categoryId)) {
      case (?perm) { perm };
      case (null) { { readAllowlist = []; commentAllowlist = [] } };
    };
  };

  public shared ({ caller }) func setCategoryPermissions(categoryId : Text, readAllowlist : [Text], commentAllowlist : [Text]) : async () {
    if (not isSuperadmin(caller)) {
      Runtime.trap("Unauthorized: Only superadmins can set category permissions");
    };
    categoryPermissions.add(categoryId, { readAllowlist; commentAllowlist });
  };

  // ── Follows ─────────────────────────────────────────────────────────────────

  public shared ({ caller }) func followUser(targetUserId : Text) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can follow others");
    };
    let userId = caller.toText();
    if (userId == targetUserId) { Runtime.trap("Cannot follow yourself") };
    switch (follows.get(userId)) {
      case (?fs) { fs.add(targetUserId) };
      case (null) {
        let newSet = Set.empty<Text>();
        newSet.add(targetUserId);
        follows.add(userId, newSet);
      };
    };
  };

  public shared ({ caller }) func unfollowUser(targetUserId : Text) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can unfollow others");
    };
    let userId = caller.toText();
    switch (follows.get(userId)) {
      case (?fs) { fs.remove(targetUserId) };
      case (null) {};
    };
  };

  public query ({ caller }) func getFollowers(userId : Text) : async [Text] {
    let followersList = List.empty<Text>();
    for ((followerId, followingSet) in follows.entries()) {
      if (followingSet.contains(userId)) { followersList.add(followerId) };
    };
    followersList.toArray();
  };

  public query ({ caller }) func getFollowing(userId : Text) : async [Text] {
    switch (follows.get(userId)) {
      case (?fs) { fs.toArray() };
      case (null) { [] };
    };
  };
};
