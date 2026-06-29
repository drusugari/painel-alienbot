import { NextResponse } from "next/server";

type CnpjaResponse = {
  taxId?: string;
  alias?: string | null;
  founded?: string;
  company?: {
    name?: string;
  };
  address?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  phones?: Array<{
    area?: string;
    number?: string;
  }>;
  emails?: Array<{
    address?: string;
  }>;
  mainActivity?: {
    id?: number;
    text?: string;
  };
};

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      "user-agent": "AlienbotSiteGenerator/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim());
  }

  return response.json();
}

function normalizeCnpja(data: CnpjaResponse) {
  const phone = data.phones?.[0];
  const email = data.emails?.[0];

  return {
    cnpj: data.taxId,
    razao_social: data.company?.name || "",
    nome_fantasia: data.alias || "",
    data_inicio_atividade: data.founded || "",
    cnae_fiscal: data.mainActivity?.id,
    cnae_fiscal_descricao: data.mainActivity?.text || "",
    municipio: data.address?.city || "",
    uf: data.address?.state || "",
    cep: data.address?.zip || "",
    ddd_telefone_1:
      phone?.area && phone?.number ? `${phone.area}${phone.number}` : "",
    email: email?.address || ""
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { cnpj: string } }
) {
  const cnpj = params.cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido." }, { status: 400 });
  }

  try {
    const data = await fetchJson(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    return NextResponse.json(data);
  } catch (brasilApiError) {
    try {
      const data = await fetchJson(`https://minhareceita.org/${cnpj}`);
      return NextResponse.json(data);
    } catch (minhaReceitaError) {
      try {
        const data = await fetchJson(`https://open.cnpja.com/office/${cnpj}`);
        return NextResponse.json(normalizeCnpja(data));
      } catch (cnpjaError) {
        return NextResponse.json(
          {
            error:
              "Não consegui consultar esse CNPJ agora. Tente novamente ou preencha os dados manualmente.",
            details: {
              brasilApi:
                brasilApiError instanceof Error ? brasilApiError.message : "falhou",
              minhaReceita:
                minhaReceitaError instanceof Error
                  ? minhaReceitaError.message
                  : "falhou",
              cnpja: cnpjaError instanceof Error ? cnpjaError.message : "falhou"
            }
          },
          { status: 502 }
        );
      }
    }
  }
}
