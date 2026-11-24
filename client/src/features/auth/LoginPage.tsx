import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/auth.api.ts';
import { loginSchema, type LoginInput } from '../../schemas/login.schema.ts';
import { loggedIn } from '../../store/authSlice.ts';
import { useAppDispatch, useAppSelector } from '../../store/store.ts';
import { getErrorMessage } from '../../lib/errors.ts';

type FieldErrors = Partial<Record<keyof LoginInput, string>>;

export function LoginPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const token = useAppSelector((state) => state.auth.token);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const mutation = useMutation({
        mutationFn: login,
        onSuccess: ({ accessToken, user }) => {
            dispatch(loggedIn({ token: accessToken, user }));
            navigate('/invoices', { replace: true });
        },
    });

    if (token) return <Navigate to="/invoices" replace />;

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const result = loginSchema.safeParse({
            email: form.get('email'),
            password: form.get('password'),
        });

        if (!result.success) {
            const errors: FieldErrors = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0] as keyof LoginInput;
                errors[field] ??= issue.message;
            }
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        mutation.mutate(result.data);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e3e7fb] to-[#aebcf8] p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-indigo-200/50">
                <div className="mb-8 rounded-xl border border-gray-100 py-4 text-center text-2xl font-bold tracking-wide text-gray-400">
                    LOGO
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
                <p className="mt-1 text-sm text-gray-500">Log in to see your invoices.</p>

                <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            aria-invalid={!!fieldErrors.email}
                            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7b8be0] focus:ring-2 focus:ring-[#c7cff7] aria-invalid:border-red-400"
                        />
                        {fieldErrors.email && <p id="email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            aria-invalid={!!fieldErrors.password}
                            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7b8be0] focus:ring-2 focus:ring-[#c7cff7] aria-invalid:border-red-400"
                        />
                        {fieldErrors.password && <p id="password-error" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
                    </div>

                    {mutation.isError && (
                        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            {getErrorMessage(mutation.error)}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full rounded-lg bg-[#7b8be0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6a7bd6] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {mutation.isPending ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );
}