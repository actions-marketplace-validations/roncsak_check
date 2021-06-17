export declare type Issue = {
  id: string
  severity: string
  title: string
  message: string
  explanation: string
  urls?: string[]
  location: {
    file: string
    line?: number
  }
}

export declare type Tree = {
  path: string
  mode: '100644' | undefined
  type: 'blob' | 'tree' | 'commit' | undefined
  content?: string
}
