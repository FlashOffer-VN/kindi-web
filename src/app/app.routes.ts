// app.routes.ts
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './shared/components/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './shared/components/layouts/guest-layout/guest-layout.component';
import { UserLayoutComponent } from './shared/components/layouts/user-layout/user-layout.component';
import { AdminGuard, AuthGuard, CredentialsGuard, GuestGuard } from './core/guards';

export const routes: Routes = [
    // Guest routes (chưa đăng nhập)
    {
        path: '',
        component: GuestLayoutComponent,
        children: [
            // Trang chủ
            { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
            { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },

            // Auth
            {
                path: 'login',
                canActivate: [GuestGuard],
                loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'admin-login',
                canActivate: [GuestGuard],
                loadComponent: () => import('./features/auth/pages/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
            },
            {
                path: 'register',
                canActivate: [GuestGuard],
                loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent)
            },
            {
                path: 'partner-register',
                loadComponent: () => import('./pages/partner-register/partner-register.component').then(m => m.PartnerRegisterComponent)
            },

            // Legal pages
            { path: 'privacy', loadComponent: () => import('./pages/legal/privacy/privacy.component').then(m => m.PrivacyComponent) },
            { path: 'terms', loadComponent: () => import('./pages/legal/terms/terms.component').then(m => m.TermsComponent) },

            // Các trang chức năng
            // { path: 'register-ctv', loadComponent: () => import('./pages/register-ctv/register-ctv.component').then(m => m.RegisterCtvComponent) },
            { path: 'connect-sme', loadComponent: () => import('./pages/connect-sme/connect-sme.component').then(m => m.ConnectSmeComponent) },
            { path: 'find-supplier', loadComponent: () => import('./pages/find-supplier/find-supplier.component').then(m => m.FindSupplierComponent) },
            { path: 'group-buying', loadComponent: () => import('./pages/group-buying/group-buying.component').then(m => m.GroupBuyingComponent) },
            { path: 'get-offer', loadComponent: () => import('./pages/get-offer/get-offer.component').then(m => m.GetOfferComponent) },
            { path: 'suppliers', loadComponent: () => import('./pages/suppliers/suppliers.component').then(m => m.SuppliersComponent) },
            { path: 'talent', loadComponent: () => import('./pages/talent/talent.component').then(m => m.TalentComponent) },
            { path: 'community', loadComponent: () => import('./pages/community/community.component').then(m => m.CommunityComponent) },
            { path: 'partner', loadComponent: () => import('./pages/partner/partner.component').then(m => m.PartnerComponent) },
            {
                path: 'social',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./pages/social/social.component').then(m => m.SocialComponent)
                    },
                    {
                        path: ':postId',
                        loadComponent: () => import('./pages/social/social.component').then(m => m.SocialComponent)
                    }
                ]
            }
            // Chi tiết đối tác
            // { path: 'partner/:id', loadComponent: () => import('./pages/partner-detail/partner-detail.component').then(m => m.PartnerDetailComponent) },
        ]
    },

    // Admin routes (chỉ admin mới vào được)
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [AdminGuard, CredentialsGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'admin-crm', loadComponent: () => import('./pages/admin/crm/admin-crm.component').then(m => m.AdminCrmComponent) },
            { path: 'offers', loadComponent: () => import('./pages/admin/offers/admin-offers.component').then(m => m.AdminOffersComponent) },
            { path: 'offers/:id', loadComponent: () => import('./pages/admin/offers/detail/offer-detail.component').then(m => m.AdminOfferDetailComponent) },
            // Purchase Request Management
            { path: 'purchase-requests', loadComponent: () => import('./pages/admin/purchase-requests/purchase-request-list.component').then(m => m.AdminPurchaseRequestListComponent) },
            { path: 'purchase-requests/:id', loadComponent: () => import('./pages/admin/purchase-requests/detail/purchase-request-detail.component').then(m => m.AdminPurchaseRequestDetailComponent) },
            // Group Buying Management
            { path: 'group-buying', loadComponent: () => import('./pages/admin/group-buying/group-buying-list.component').then(m => m.AdminGroupBuyingListComponent) },
            { path: 'group-buying/:id', loadComponent: () => import('./pages/admin/group-buying/detail/group-buying-detail.component').then(m => m.AdminGroupBuyingDetailComponent) },
            { path: 'settings', loadComponent: () => import('./pages/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent) },
            { path: 'demo', loadComponent: () => import('./pages/demo/demo.component').then(m => m.DemoComponent) },
            { path: 'social-posts', loadComponent: () => import('./pages/admin/social/social-post-list.component').then(m => m.AdminSocialPostListComponent) },
            // Collaborator Management
            { path: 'collaborator', loadComponent: () => import('./pages/admin/collaborator/collaborator-list.component').then(m => m.AdminCollaboratorListComponent) },
            { path: 'collaborator/:id', loadComponent: () => import('./pages/admin/collaborator/detail/collaborator-detail.component').then(m => m.AdminCollaboratorDetailComponent) },
            // Partner Management
            { path: 'partner', loadComponent: () => import('./pages/admin/partner/partner-list.component').then(m => m.AdminPartnerListComponent) },
            { path: 'partner/:id', loadComponent: () => import('./pages/admin/partner/detail/partner-detail.component').then(m => m.AdminPartnerDetailComponent) },
        ]
    },

    // User routes (cần đăng nhập)
    {
        path: 'user',
        component: UserLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            { path: '', redirectTo: 'profile', pathMatch: 'full' },
            // Bắt buộc đổi tên đăng nhập + mật khẩu ở lần đăng nhập đầu (không gắn CredentialsGuard để tránh vòng lặp)
            {
                path: 'change-credentials',
                loadComponent: () => import('./pages/profile/change-credentials/change-credentials.component').then(m => m.ChangeCredentialsPageComponent)
            },
            {
                path: 'profile',
                canActivate: [CredentialsGuard],
                loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
            },
        ]
    },

    // Fallback
    { path: '**', redirectTo: '' }
];