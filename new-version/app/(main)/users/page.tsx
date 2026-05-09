
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserClient, { UserData } from './user-client';

export default async function UserServerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('at')?.value;
  if (!token) {
    redirect('/auth?next=/');
  }

  const data: UserData[] = [
    {
      "id": "112001",
      "name": "Đoàn Ngọc Minh Quân",
      "email": "doanngocminhquan.9a4@gmail.com",
      "phone": "0934177280",
      "role": "Student",
      "status": "PendingApproved",
      "className": "12A1",
      "guardians": [
        {
          "id": "2120002",
          "name": "Đoàn Đức Hùng",
          "email": "hungdr1969@gmail.com",
          "phone": "0908108855",
          "relationship": "Ba"
        },
        {
          "id": "2120001",
          "name": "Trần Thị Tuyết Mai",
          "email": "mtran0170@gmail.com",
          "phone": "0906022137",
          "relationship": "Mẹ"
        }
      ]
    }
  ];

  return <UserClient data={data} />;
}