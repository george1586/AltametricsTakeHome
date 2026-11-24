import { Outlet, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { loggedOut } from '../store/authSlice.ts';
import { useAppDispatch, useAppSelector } from '../store/store.ts';

const menu = ['Home', 'Invoices', 'Bills', 'Expenses', 'Reports'];

function Chevron() {
    return (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-gray-500">
            <path fillRule="evenodd" d="M7.2 14.8a.75.75 0 0 1 0-1.06L10.94 10 7.2 6.26a.75.75 0 1 1 1.06-1.06l4.27 4.27a.75.75 0 0 1 0 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
        </svg>
    );
}

export function AppLayout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAppSelector((state) => state.auth.user);

    const initials = (user?.name ?? user?.email ?? '?')
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    function logout() {
        dispatch(loggedOut());
        queryClient.clear();
        navigate('/login', { replace: true });
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-[#e3e7fb] to-[#aebcf8]">
            <aside className="hidden w-60 shrink-0 flex-col px-6 py-8 md:flex">
                <div className="rounded-xl bg-white py-5 text-center text-2xl font-bold tracking-wide text-gray-400 shadow-sm">LOGO</div>
                <p className="mt-10 text-sm text-gray-500">Menu</p>
                <nav className="mt-6 space-y-5">
                    {menu.map((item) => {
                        const active = item === 'Invoices';
                        return (
                            <div
                                key={item}
                                aria-current={active ? 'page' : undefined}
                                className={`flex items-center gap-3 ${active ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                            >
                                <span className="w-4">{item !== 'Home' && <Chevron />}</span>
                                {item}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col bg-white md:my-2 md:mr-2 md:rounded-3xl">
                <header className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5 md:px-10">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">Home</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-900">Invoices</span>
                    </nav>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-gray-600 sm:inline">{user?.name}</span>
                        <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7b8be0] text-sm font-semibold text-white">
                            {initials}
                        </div>
                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        >
                            Log out
                        </button>
                    </div>
                </header>

                <main className="flex-1 px-6 py-8 md:px-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}