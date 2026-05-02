export const API_URL = "https://api.pteducation.edu.vn/api/";
// export const API_URL = "http://localhost:5083/api/";

const API_V0_URL = API_URL;
const API_V2_URL = `${API_URL}v2/`;
const API_V1_URL = `${API_URL}v1/`;

function buildApiUrl(version, path) {
  const baseUrl =
    version === "v2" ? API_V2_URL : version === "v1" ? API_V1_URL : API_V0_URL;
  return `${baseUrl}${path}`;
}

async function requestApi(path, options = {}) {
  const { version = "v0", method = "GET", token, body } = options;
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  const fetchOptions = {
    method,
    headers,
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(buildApiUrl(version, path), fetchOptions);
  return { isSuccess: res.ok, res };
}

export async function LOGIN(body) {
  return requestApi("authentication/login", {
    version: "v2",
    method: "POST",
    body,
  });
}

export async function CHECKSERVER(token) {
  return requestApi("authentication/check-server", {
    version: "v1",
    token,
  });
}

export async function GETCLASSES(token, query) {
  return requestApi(`class/all?${query}`, { token });
}

export async function GETMANAGERS(token, query) {
  return requestApi(`admin/managers?${query}`, { token });
}

export async function ADDMANAGERS(token, body) {
  return requestApi("admin/managers", {
    token,
    method: "POST",
    body,
  });
}

export async function DEACTIVATEMANAGERS(token, id) {
  return requestApi(`admin/manager/deactivate/${id}`, {
    token,
    method: "POST",
  });
}

export async function REACTIVATEMANAGERS(token, id) {
  return requestApi(`admin/manager/reactivate/${id}`, {
    token,
    method: "POST",
  });
}

export async function UPDATECLASSINFO(token, body) {
  return requestApi("class/update", {
    token,
    method: "PUT",
    body,
  });
}

export async function UPDATESTUDENTINFO(token, body, id) {
  return requestApi(`admin/student/${id}`, {
    token,
    method: "PUT",
    body,
  });
}

export async function DELETESTUDENT(token, id) {
  return requestApi(`admin/student/${id}`, {
    token,
    method: "DELETE",
  });
}

export async function DELETESCORE(token, id) {
  return requestApi(`score/delete/${id}`, {
    token,
    method: "DELETE",
  });
}

export async function CLASSDETAIL(token, id) {
  return requestApi(`class/${id}`, { token });
}

export async function DELETECLASS(token, id) {
  return requestApi("class/delete", {
    token,
    method: "PUT",
    body: id,
  });
}

export async function HARDDELETECLASS(token, id) {
  return requestApi("class/delete", {
    token,
    method: "DELETE",
    body: id,
  });
}

export async function RESTORECLASS(token, id) {
  return requestApi("class/restore", {
    token,
    method: "PUT",
    body: id,
  });
}

export async function CREATECLASS(token, body) {
  return requestApi("class/create", {
    token,
    method: "POST",
    body,
  });
}

export async function CREATESCORE(token, body) {
  return requestApi("score/create", {
    token,
    method: "POST",
    body,
  });
}

export async function GETTEMPLATEIMPORTSTUDENT(token) {
  return requestApi("template/import-student", { token });
}

export async function GETEXPORTREPORT(token, classId, FromDate, ToDate) {
  return requestApi(
    `class/${classId}/score?FromDate=${FromDate}&ToDate=${ToDate}`,
    { token, method: "POST" },
  );
}

export async function GETTEMPLATEIMPORTMANAGER(token) {
  return requestApi("template/import-manager", { token });
}

export async function GETTEMPLATEIMPORTSCORESTUDENT(token, classId) {
  return requestApi(`template/import-score?ClassId=${classId}`, { token });
}

export async function GETTEMPLATEIMPORTATTENDANCESTUDENT(token, classId) {
  return requestApi(`template/import-attendance?ClassId=${classId}`, {
    token,
  });
}

export async function GETLISTCLASSSELECT(token) {
  return requestApi("class/select/all", { token });
}

export async function GETALLSCORES(token, classId) {
  return requestApi(`score/all?ClassId=${classId}`, { token });
}

export async function GETALLATTENDANCES(token, classId) {
  return requestApi(`attendance/all?ClassId=${classId}`, { token });
}

export async function GETSCORE(token, scoreId) {
  return requestApi(`score/get?Id=${scoreId}`, { token });
}

export async function GETATTENDANCE(token, attendanceId) {
  return requestApi(`attendance/get?Id=${attendanceId}`, { token });
}

export async function UPDATESCOREDETAIL(token, body) {
  return requestApi("score-detail/update", {
    token,
    method: "PUT",
    body,
  });
}

export async function UPDATEATTENDANCEDETAIL(token, body) {
  return requestApi("attendance-detail/update", {
    token,
    method: "PUT",
    body,
  });
}

export async function GETMONTHTEST(token) {
  return requestApi("score-detail/month", { token });
}

export async function GETMONTHATTENDANCE(token) {
  return requestApi("attendance-detail/month", { token });
}

export async function GETSCORESTUDENT(token, query) {
  return requestApi(`score-detail?Month=${query.month}&Year=${query.year}`, {
    token,
  });
}

export async function GETATTENDANCESTUDENT(token, query) {
  return requestApi(
    `attendance-detail?Month=${query.month}&Year=${query.year}`,
    { token },
  );
}

export async function GETMYPROFILE(token) {
  return requestApi("user/me", { token });
}

export async function CHANGEPASSWORD(token, body) {
  return requestApi("authentication/change-password", {
    token,
    method: "POST",
    body,
  });
}

export async function CREATEATTENDANCE(token, body) {
  return requestApi("attendance/create", {
    token,
    method: "POST",
    body,
  });
}

export async function SENDOTP(body) {
  return requestApi("otp/send", {
    method: "POST",
    body,
  });
}

export async function VERIFYOTP(body) {
  return requestApi("otp/verify", {
    method: "POST",
    body,
  });
}

export async function RESETPASSWORD(token, body) {
  return requestApi("authentication/reset-password", {
    version: "v1",
    token,
    method: "POST",
    body,
  });
}

export async function ADDSTUDENTSINTOCLASS(token, body) {
  return requestApi("class/add-student", {
    token,
    method: "POST",
    body,
  });
}

export async function MOVEOUTSTUDENT(token, body) {
  return requestApi("class/move-out", {
    token,
    method: "PUT",
    body,
  });
}
