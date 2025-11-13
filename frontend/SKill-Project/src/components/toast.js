import { createContext, useContext } from 'react'

export const ToastCtx = createContext({ notify: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}
