// src/app/core/models/social.model.ts

// ===== ENUMS =====
export enum PostType {
    Post = 1,
    Question = 2,
    Event = 3,
    Announcement = 4
}

export enum PrivacyType {
    Public = 1,
    Friends = 2,
    Private = 3
}

export enum PriorityType {
    Low = 1,
    Normal = 2,
    High = 3
}

// ===== INTERFACES =====
export interface Author {
    id: string;
    userCode?: string;
    fullName: string;
    username: string;
    avatar?: string;
    role?: string;
    isVerified: boolean;
}

export interface SocialPost {
    id: string;
    author: Author;
    title?: string;
    content: string;
    type: PostType;
    privacy: PrivacyType;
    tags: string[];
    images?: any[];           // ✅ nullable - API chưa hỗ trợ upload
    video?: string;           // ✅ nullable - API chưa hỗ trợ video
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isLiked: boolean;
    isSaved: boolean;
    isPinned?: boolean;         // ✅ Admin ghim lên đầu feed
    isApproved?: boolean;       // ✅ Trạng thái duyệt (admin)
    createdAt: string;
    isExpanded?: boolean;     // ✅ UI only

    // For Question
    isAnswered?: boolean;

    // For Event
    eventDate?: string;
    location?: string;
    maxParticipants?: number;
    currentParticipants?: number;
    isOnline?: boolean;

    // For Announcement
    priority?: PriorityType;
    pinnedUntil?: string;
    showActions?: boolean;
}

export interface SocialMember {
    id: string;
    name: string;
    username: string;
    avatar: string;
    role?: string;
    company?: string;
    followers: number;
    following: number;
    posts: number;
    isFollowing: boolean;
    isOnline: boolean;
    isVerified?: boolean;
}

export interface SocialGroup {
    id: number;
    name: string;
    description: string;
    icon: string;
    members: number;
    posts: number;
    isJoined: boolean;
    isPrivate: boolean;
}

export interface SocialComment {
    id: number;
    author?: {
        id: string;
        name: string;
        avatar: string;
        username: string;
    };
    content: string;
    likes: number;
    isLiked: boolean;
    createdAt: string;
    replies?: SocialComment[];
}

// ===== REQUEST / RESPONSE =====
export interface CreatePostRequest {
    title?: string;
    content: string;
    type: PostType;
    privacy: PrivacyType;
    tags: string[];
    images?: any[];           // ✅ nullable
    video?: string;           // ✅ nullable
    isAnswered?: boolean;
    eventDate?: string;
    location?: string;
    maxParticipants?: number;
    isOnline?: boolean;
    priority?: PriorityType;
    pinnedUntil?: string;
}

export interface UpdatePostRequest {
    title?: string;
    content?: string;
    type?: PostType;
    privacy?: PrivacyType;
    tags?: string[];
    images?: any[];           // ✅ nullable
    video?: string;           // ✅ nullable
    isAnswered?: boolean;
    eventDate?: string;
    location?: string;
    maxParticipants?: number;
    isOnline?: boolean;
    priority?: PriorityType;
    pinnedUntil?: string;
}

export interface GetPostsQuery {
    pageNumber?: number;
    pageSize?: number;
    type?: PostType;
    privacy?: PrivacyType;
    tag?: string;
}