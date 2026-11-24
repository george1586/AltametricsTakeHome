import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  selectedInvoiceId: string | null;
  page: number;
}

const initialState: UiState = { selectedInvoiceId: null, page: 1 };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    invoiceSelected(state, action: PayloadAction<string | null>) {
      state.selectedInvoiceId = action.payload;
    },
    pageChanged(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
  },
});

export const { invoiceSelected, pageChanged } = uiSlice.actions;
export default uiSlice.reducer;