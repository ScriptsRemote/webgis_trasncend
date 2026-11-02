// Hook PreToolUse — protege o banco Supabase do projeto.
// Qualquer comando (Bash/PowerShell) ou ferramenta MCP que possa ALTERAR o banco
// (gravar, atualizar, apagar, mudar estrutura, permissões, funções ou segredos)
// exige confirmação explícita do usuário antes de rodar. Leituras simples passam.
let entrada = '';
process.stdin.on('data', (c) => { entrada += c; });
process.stdin.on('end', () => {
  let dados;
  try { dados = JSON.parse(entrada); } catch (e) { return; }
  const ferramenta = dados.tool_name || '';
  const inp = dados.tool_input || {};
  let motivo = null;

  if (ferramenta.startsWith('mcp__')) {
    const nome = ferramenta.toLowerCase();
    if (/supabase|postgres|database|\bdb\b/.test(nome) &&
        /execute_sql|apply_migration|query|delete|update|insert|drop|reset|create|deploy|branch|pause|restore|secret/.test(nome)) {
      motivo = `ferramenta MCP de banco: ${ferramenta}`;
    }
  } else if (ferramenta === 'Bash' || ferramenta === 'PowerShell') {
    const cmd = String(inp.command || '');
    const tocaBanco = /supabase\.co|pooler\.supabase|\bsupabase\s|\bpsql\b|\bpg_(dump|restore)\b|postgres(ql)?:\/\//i.test(cmd);
    if (tocaBanco) {
      const ferramentaDireta = /\bpsql\b|\bpg_restore\b|\bsupabase\s/i.test(cmd);   // cliente SQL / CLI: sempre perguntar
      const escreve = /-X\s*['"]?(POST|PATCH|PUT|DELETE)|--request\s+['"]?(POST|PATCH|PUT|DELETE)|\s(-d|--data(-raw|-binary)?|--json)\s|\/rpc\/|-Method\s+['"]?(Post|Patch|Put|Delete)|\b(DELETE|UPDATE|INSERT|UPSERT|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|COMMENT)\b|\bdb\s+(push|reset)|migration|functions\s+(deploy|delete)|secrets\s+(set|unset)/i.test(cmd);
      if (ferramentaDireta || escreve) motivo = 'comando que pode alterar o banco Supabase';
    }
  }

  if (motivo) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: `PROTEÇÃO DO BANCO: ${motivo}. Confirme antes de executar (gravar, atualizar, apagar ou mudar estrutura/permissões).`,
      },
    }));
  }
});
