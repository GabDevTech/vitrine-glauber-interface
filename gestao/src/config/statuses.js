// Valor usado nos dados; rótulo exibido à equipe; tom visual do componente.
export const statuses = [
  { value: 'rascunho', label: 'Rascunho', tone: 'draft' },
  { value: 'em-revisao', label: 'Em revisão', tone: 'review' },
  { value: 'pronto', label: 'Pronto para publicar', tone: 'ready' },
  { value: 'publicado', label: 'Publicado', tone: 'published' },
]
export const statusByValue = (value) => statuses.find((status) => status.value === value)
