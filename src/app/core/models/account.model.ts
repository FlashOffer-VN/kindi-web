/**
 * Thông tin tài khoản vừa được tạo tự động từ form công khai
 * (username user<sđt>, mật khẩu khởi tạo = số điện thoại).
 */
export interface AccountCredentials {
    isNewAccount: boolean;
    accountAlreadyExisted: boolean;
    username?: string | null;
    passwordIsPhone: boolean;
}
