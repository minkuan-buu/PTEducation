import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from "next";
import ChatClient from './chat-client';

export const metadata: Metadata = {
    title: "Trò chuyện realtime",
    description: "Hệ thống giáo dục PTEducation.",
};

export default async function ChatServerPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('at')?.value;
    if (!token) {
        redirect('/auth?next=/chat');
    }

    return <ChatClient />;
}
