export const API_URL = "https://api.pteducation.edu.vn/api/";
// export const API_URL = "http://localhost:5083/api/";

export async function LOGIN(body) {
    const res = await fetch(API_URL + "authentication/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function CHECKSERVER(token) {
    const res = await fetch(API_URL + "authentication/check-server", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETCLASSES(token, query) {
    const res = await fetch(API_URL + `class/all?${query}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETMANAGERS(token, query) {
    const res = await fetch(API_URL + `admin/managers?${query}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function ADDMANAGERS(token, body) {
    const res = await fetch(API_URL + `admin/managers`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function DEACTIVATEMANAGERS(token, id) {
    const res = await fetch(API_URL + `admin/manager/deactivate/${id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function REACTIVATEMANAGERS(token, id) {
    const res = await fetch(API_URL + `admin/manager/reactivate/${id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function UPDATECLASSINFO(token, body) {
    const res = await fetch(API_URL + `class/update`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function UPDATESTUDENTINFO(token, body, id) {
    const res = await fetch(API_URL + `admin/student/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function DELETESTUDENT(token, id) {
    const res = await fetch(API_URL + `admin/student/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function CLASSDETAIL(token, id) {
    const res = await fetch(API_URL + `class/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function DELETECLASS(token, id) {
    const res = await fetch(API_URL + `class/delete`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(id)
    })
    return { isSuccess: res.ok, res }
}

export async function HARDDELETECLASS(token, id) {
    const res = await fetch(API_URL + `class/delete`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(id)
    })
    return { isSuccess: res.ok, res }
}

export async function RESTORECLASS(token, id) {
    const res = await fetch(API_URL + `class/restore`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(id)
    })
    return { isSuccess: res.ok, res }
}

export async function CREATECLASS(token, body) {
    const res = await fetch(API_URL + "class/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function CREATESCORE(token, body) {
    const res = await fetch(API_URL + "score/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function GETTEMPLATEIMPORTSTUDENT(token) {
    const res = await fetch(API_URL + "template/import-student", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETTEMPLATEIMPORTMANAGER(token) {
    const res = await fetch(API_URL + "template/import-manager", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETTEMPLATEIMPORTSCORESTUDENT(token, classId) {
    const res = await fetch(API_URL + `template/import-score?ClassId=${classId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETTEMPLATEIMPORTATTENDANCESTUDENT(token, classId) {
    const res = await fetch(API_URL + `template/import-attendance?ClassId=${classId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}


export async function GETLISTCLASSSELECT(token) {
    const res = await fetch(API_URL + "class/select/all", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETALLSCORES(token, classId) {
    const res = await fetch(API_URL + `score/all?ClassId=${classId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETALLATTENDANCES(token, classId) {
    const res = await fetch(API_URL + `attendance/all?ClassId=${classId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETSCORE(token, scoreId) {
    const res = await fetch(API_URL + `score/get?Id=${scoreId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETATTENDANCE(token, attendanceId) {
    const res = await fetch(API_URL + `attendance/get?Id=${attendanceId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function UPDATESCOREDETAIL(token, body) {
    const res = await fetch(API_URL + `score-detail/update`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function UPDATEATTENDANCEDETAIL(token, body) {
    const res = await fetch(API_URL + `attendance-detail/update`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function GETMONTHTEST(token) {
    const res = await fetch(API_URL + `score-detail/month`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETMONTHATTENDANCE(token) {
    const res = await fetch(API_URL + `attendance-detail/month`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETSCORESTUDENT(token, query) {
    const res = await fetch(API_URL + `score-detail?Month=${query.month}&Year=${query.year}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETATTENDANCESTUDENT(token, query) {
    const res = await fetch(API_URL + `attendance-detail?Month=${query.month}&Year=${query.year}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function GETMYPROFILE(token) {
    const res = await fetch(API_URL + `user/me`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
    })
    return { isSuccess: res.ok, res }
}

export async function CHANGEPASSWORD(token, body) {
    const res = await fetch(API_URL + `authentication/change-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function CREATEATTENDANCE(token, body) {
    const res = await fetch(API_URL + `attendance/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function SENDOTP(body) {
    const res = await fetch(API_URL + `otp/send`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function VERIFYOTP(body) {
    const res = await fetch(API_URL + `otp/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function RESETPASSWORD(token, body) {
    const res = await fetch(API_URL + `authentication/reset-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function ADDSTUDENTSINTOCLASS(token, body) {
    const res = await fetch(API_URL + `class/add-student`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}

export async function MOVEOUTSTUDENT(token, body) {
    const res = await fetch(API_URL + `class/move-out`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    })
    return { isSuccess: res.ok, res }
}
