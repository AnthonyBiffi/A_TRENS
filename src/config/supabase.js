// Equivalente ao conexao.java adaptado para Supabase (@supabase/supabase-js)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_KEY || '').trim();

const credenciaisConfiguradas =
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('seu-projeto.supabase.co') &&
  supabaseKey.length > 20 &&
  !supabaseKey.includes('sua-anon-key');

export const supabase = credenciaisConfiguradas
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  : null;

let supabaseConectado = false;

export async function verificarConexaoSupabase() {
  if (!supabase) {
    supabaseConectado = false;
    console.warn('[Supabase] SUPABASE_URL ou SUPABASE_KEY não configurados no .env.');
    console.warn('[Fallback] Operando em modo local (data/avaliacoes_fallback.json) até você preencher o .env.');
    return false;
  }

  try {
    const { error } = await supabase.from('avaliacoes').select('id').limit(1);
    if (error) {
      throw error;
    }
    supabaseConectado = true;
    console.log('[Supabase] Conectado à tabela public.avaliacoes com sucesso.');
    return true;
  } catch (err) {
    supabaseConectado = false;
    console.error('[Supabase] Falha ao validar conexão:', err.message);
    console.warn('[Supabase] Verifique se você rodou sql/supabase_schema.sql no SQL Editor do Supabase.');
    return false;
  }
}

export function isSupabaseConectado() {
  return supabaseConectado;
}
