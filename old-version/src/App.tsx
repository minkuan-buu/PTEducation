import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import ClassDetail from "@/pages/class-detail";
import MyProfile from "@/pages/about";
import ScoreDetail from "@/pages/score-detail";
import AttendanceDetail from "@/pages/attendance-detail";
import ManageClassesPage from "@/pages/manage-classes";
import ComingSoonPage from "@/pages/coming-soon";
import AttendancePage from "@/pages/attendance";
import ManageAssistantsPage from "./pages/manage-assistants";
import MaintenancePage from "./pages/maintainance";

function App() {
  return (
    <Routes>
      {/* <Route element={<IndexPage />} path="/" />
      <Route element={<ManageClassesPage />} path="/manage-classes" />
      <Route element={<ScoreDetail />} path="/class/:id/score/:scoreId" />
      <Route element={<ClassDetail />} path="/class/:id" />
      <Route element={<MyProfile />} path="/user/me" />
      <Route element={<ManageAssistantsPage />} path="/manage-assistants" />
      <Route element={<ComingSoonPage />} path="/user/:id" />
      <Route element={<AttendancePage />} path="/attendance" />
      <Route
        element={<AttendanceDetail />}
        path="/class/:id/attendance/:attendanceId"
      /> */}
      <Route element={<MaintenancePage />} path="*" />
    </Routes>
  );
}

export default App;
