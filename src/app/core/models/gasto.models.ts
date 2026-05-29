export type SituacaoGasto = 'PENDENTE' | 'PAGO' | 'CANCELADO' | string;

export interface Gasto {
  id?: number;
  descricao: string;
  valor: number;
  dataPagamento?: string;
  dataVencimento?: string;
  situacao: SituacaoGasto;
  categoria?: string;
  observacao?: string;
  periodo?: number;
  idUser?: number;
  idCategoria?: number;
  nomeCategoria?: string;
}

export interface ResumoGastos {
  total?: number;
  totalPago?: number;
  totalPendente?: number;
  quantidade?: number;
  maiorGasto?: number;
  menorGasto?: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Categoria {
    id: number;
    nome: string;
}
