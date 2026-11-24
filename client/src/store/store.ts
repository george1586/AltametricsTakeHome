import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice.ts';
import uiReducer from './uiSlice.ts';

export const store = configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
});

store.subscribe(() => {
    const { token, user } = store.getState().auth;
    if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();