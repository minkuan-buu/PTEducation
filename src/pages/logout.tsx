export default function Logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("isShowChangePassword");
    localStorage.removeItem("isNeedToChangePassword");
    window.location.href = "/";
}