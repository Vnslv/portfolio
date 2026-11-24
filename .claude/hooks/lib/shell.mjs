// A conservative shell reader for guards (Bash and PowerShell). Node built-ins only.
// It is not a full parser: guards allow known-safe commands and refuse the rest, and
// refuse whatever could not be read to the end (incomplete).

const MAX_DEPTH = 50;
const BASH_LITERAL = /[^\w.\/\-\n]/;
const CLOSERS = new Set(['}', 'done', 'fi', 'esac']);
const OPENERS = new Set(['{', 'if', 'for', 'while', 'until', 'case', 'select']);

class Reader {
  constructor(text, powershell, depth = 0) {
    this.depth = depth;
    this.text = text;
    this.ps = powershell;
    this.escape = powershell ? '`' : '\\';
    this.i = 0;
    this.incomplete = false;
    this.arithmetic = 0;
  }

  /** Statements up to the closing character (or the end of the text when close is ''). */
  list(close) {
    if (this.depth >= MAX_DEPTH) {
      this.incomplete = true;
      this.i = this.text.length;
      return [];
    }
    this.depth++;
    const statements = this.read(close);
    this.depth--;
    return statements;
  }

  read(close) {
    const statements = [];
    let segments = [];
    let segment, word, started, target, piped = false;
    const heredocs = [];
    const reset = () => {
      segment = { words: [], redirects: [], heredocs: [], nested: false };
      word = '';
      started = false;
      target = false;
    };
    const endWord = () => {
      if (!started) return;
      // Stop-parsing token: the rest of the line follows other rules.
      if (this.ps && word === '--%') this.incomplete = true;
      (target ? segment.redirects : segment.words).push(word);
      word = '';
      started = false;
      target = false;
    };
    const endSegment = () => {
      endWord();
      if (segment.words.length || segment.redirects.length || segment.heredocs.length) {
        segments.push(segment);
        piped = false;
      }
      reset();
    };
    const endStatement = () => {
      endSegment();
      if (segments.length) statements.push(segments);
      segments = [];
      piped = false;
    };
    const put = (s) => {
      word += s;
      started = true;
    };
    /** Read a nested list; its commands are linked to the current statement. */
    const nest = (end) => {
      for (const s of this.list(end).flat()) segments.push({ ...s, nested: true });
    };
    const readHeredocs = () => {
      for (const { tag, literal, stripTabs, owner } of heredocs.splice(0)) {
        const lines = [];
        let closed = false;
        let held = '';
        while (this.i < this.text.length) {
          const end = this.text.indexOf('\n', this.i);
          const line = this.text.slice(this.i, end < 0 ? undefined : end);
          this.i = end < 0 ? this.text.length : end + 1;
          const full = held + (stripTabs && !held ? line.replace(/^\t+/, '') : line);
          // Backslash-newline joins lines in an unquoted heredoc, including its end tag.
          if (!literal && /(?:^|[^\\])(?:\\\\)*\\$/.test(full)) {
            held = full.slice(0, -1);
            continue;
          }
          held = '';
          if (full === tag) {
            closed = true;
            break;
          }
          lines.push(full);
        }
        if (held) lines.push(held);
        if (!closed) this.incomplete = true;
        owner.heredocs.push(lines.join('\n'));
        if (!literal) this.expand(lines.join('\n'), (inner) => segments.push(...inner));
      }
    };
    reset();

    while (this.i < this.text.length) {
      const c = this.text[this.i];
      const next = this.text[this.i + 1];
      const prev = this.text[this.i - 1];
      if (close && c === close) {
        endStatement();
        this.i++;
        return mergeBlocks(statements);
      }
      if (c === this.escape && (this.ps || c === '\\') && next !== undefined) {
        if (next === '\n') this.i += 2;
        else if (this.ps || BASH_LITERAL.test(next)) {
          put(next);
          this.i += 2;
        } else {
          put(c);
          this.i++;
        }
      } else if (this.ps && c === '@' && (next === "'" || next === '"') && /^[ \t]*\n/.test(this.text.slice(this.i + 2))) {
        const open = this.text.indexOf('\n', this.i);
        const end = this.text.indexOf(`\n${next}@`, open);
        if (end < 0) return this.stop(statements, endStatement);
        const body = this.text.slice(open + 1, Math.max(open + 1, end));
        this.i = end + 3;
        put(body);
        if (next === '"') this.expand(body, (inner) => segments.push(...inner));
      } else if (!this.ps && c === '$' && next === "'") {
        let body = '';
        for (this.i += 2; this.i < this.text.length && this.text[this.i] !== "'"; this.i++) {
          if (this.text[this.i] === '\\') this.i++;
          body += this.text[this.i] ?? '';
        }
        if (this.i >= this.text.length) return this.stop(statements, endStatement);
        this.i++;
        put(body);
      } else if (c === "'") {
        const end = this.text.indexOf("'", this.i + 1);
        if (end < 0) return this.stop(statements, endStatement);
        put(this.text.slice(this.i + 1, end));
        this.i = end + 1;
      } else if (c === '"') {
        this.i++;
        const body = this.doubleQuoted((inner) => segments.push(...inner));
        put(body);
        if (this.incomplete) return this.stop(statements, endStatement);
      } else if (c === '$' && next === '{') {
        put(this.braced((inner) => segments.push(...inner)));
      } else if (this.ps && c === '<' && next === '#') {
        const end = this.text.indexOf('#>', this.i + 2);
        if (end < 0) return this.stop(statements, endStatement);
        endWord();
        this.i = end + 2;
      } else if (c === '#' && !started && (this.ps || prev === undefined || /[\s;|&()<>]/.test(prev))) {
        const end = this.text.indexOf('\n', this.i);
        this.i = end < 0 ? this.text.length : end;
      } else if (this.ps && c === '#' && started && /['"`({@<]/.test(this.text.slice(this.i + 1).split('\n', 1)[0])) {
        // Comment or part of the word? PowerShell decides by token, so do not guess past a quote.
        return this.stop(statements, endStatement);
      } else if (!this.ps && c === '$' && next === '[') {
        return this.stop(statements, endStatement); // old arithmetic, where << is not a heredoc
      } else if (!this.ps && c === '<' && next === '<' && this.text[this.i + 2] !== '<') {
        endWord();
        if (this.arithmetic || segment.words.some((w) => /\w\[[^\]]*$/.test(w))) return this.stop(statements, endStatement);
        const match = /^<<(-?)[ \t]*((?:'[^'\n]*'|"[^"\n]*"|\\.|[^\s;|&<>()'"\\])+)/.exec(this.text.slice(this.i));
        if (!match) return this.stop(statements, endStatement);
        heredocs.push({
          tag: match[2].replace(/['"\\]/g, ''),
          literal: /['"\\]/.test(match[2]),
          stripTabs: match[1] === '-',
          owner: segment,
        });
        this.i += match[0].length;
      } else if (c === '<' || (c === '&' && next === '>')) {
        endWord();
        this.i++;
      } else if (c === '>') {
        if (/^[\d*]$/.test(word)) reset2();
        endWord();
        this.i++;
        while (this.text[this.i] === '>' || this.text[this.i] === '|') this.i++;
        const dup = /^&(?:\d+-?|-)(?![^\s;|&()<>])/.exec(this.text.slice(this.i));
        if (dup) this.i += dup[0].length;
        else {
          if (this.text[this.i] === '&') this.i++;
          target = true;
        }
      } else if (c === '(') {
        const math = !this.ps && (next === '(' || prev === '(') ? 1 : 0;
        this.i++;
        put('()');
        this.arithmetic += math;
        nest(')');
        this.arithmetic -= math;
      } else if (this.ps && c === '{') {
        this.i++;
        put('{}');
        nest('}');
      } else if (!this.ps && c === '`') {
        const end = backtickEnd(this.text, this.i + 1);
        if (end < 0) return this.stop(statements, endStatement);
        put('()');
        segments.push(...this.sub(this.text.slice(this.i + 1, end).replace(/\\([\\`$])/g, '$1')));
        this.i = end + 1;
      } else if (c === ')' || (this.ps && c === '}')) {
        endStatement(); // stray close, e.g. a case pattern
        this.i++;
      } else if (c === '|' && next !== '|') {
        this.i += next === '&' ? 2 : 1;
        endSegment();
        piped = true;
      } else if (c === '&' && next !== '&' && piped && !started && !segment.words.length) {
        this.i++; // PowerShell call operator after a pipe
      } else if (c === '\n') {
        this.i++;
        const waiting = piped && !started && !segment.words.length;
        if (heredocs.length) readHeredocs();
        if (this.ps && /^\s*\|(?!\|)/.test(this.text.slice(this.i))) endWord();
        else if (!waiting) endStatement();
      } else if (c === ';' || c === '|' || c === '&') {
        this.i += next === c ? 2 : 1;
        endStatement();
      } else if (/\s/.test(c)) {
        endWord();
        this.i++;
      } else {
        put(c);
        this.i++;
      }
    }
    if (close) this.incomplete = true;
    endStatement();
    return mergeBlocks(statements);

    // A stream number before ">" (2>, *>) is not an argument.
    function reset2() {
      word = '';
      started = false;
    }
  }

  stop(statements, endStatement) {
    this.incomplete = true;
    this.i = this.text.length;
    endStatement();
    return mergeBlocks(statements);
  }

  /** Parse text as its own command list and return its segments as nested ones. */
  sub(text) {
    const inner = new Reader(text, this.ps, this.depth);
    const segments = inner.list('').flat().map((s) => ({ ...s, nested: true }));
    if (inner.incomplete) this.incomplete = true;
    return segments;
  }

  /** Substitutions inside a string body that is already delimited (heredoc, here-string). */
  expand(body, add) {
    const inner = new Reader(body, this.ps, this.depth);
    while (inner.i < body.length) inner.stringPart(add);
    if (inner.incomplete) this.incomplete = true;
  }

  /** One piece of a double-quoted string at this.i; returns its text. */
  stringPart(add) {
    const c = this.text[this.i];
    const next = this.text[this.i + 1];
    if (c === this.escape && next !== undefined && (this.ps || /["\\$`\n]/.test(next))) {
      this.i += 2;
      return next === '\n' ? '' : next;
    }
    if (c === '$' && next === '(') {
      const start = this.i;
      this.i += 2;
      for (const s of this.list(')').flat()) add([{ ...s, nested: true }]);
      return this.text.slice(start, start + 2) + ')';
    }
    if (c === '$' && next === '{') return this.braced(add);
    if (c === '`' && !this.ps) {
      const end = backtickEnd(this.text, this.i + 1);
      if (end < 0) {
        this.incomplete = true;
        this.i = this.text.length;
        return '';
      }
      add(this.sub(this.text.slice(this.i + 1, end).replace(/\\([\\`$])/g, '$1')));
      this.i = end + 1;
      return '()';
    }
    this.i++;
    return c;
  }

  doubleQuoted(add) {
    let body = '';
    while (this.i < this.text.length) {
      if (this.text[this.i] === '"') {
        this.i++;
        return body;
      }
      body += this.stringPart(add);
    }
    this.incomplete = true;
    return body;
  }

  /** ${...}; commands inside it still count. */
  braced(add) {
    let body = '${';
    this.i += 2;
    while (this.i < this.text.length && this.text[this.i] !== '}') {
      if (this.text[this.i] === '"') {
        this.i++;
        body += this.doubleQuoted(add);
      } else body += this.stringPart(add);
    }
    if (this.i >= this.text.length) this.incomplete = true;
    this.i++;
    return `${body}}`;
  }
}

function backtickEnd(text, from) {
  for (let i = from; i < text.length; i++) {
    if (text[i] === '\\') i++;
    else if (text[i] === '`') return i;
  }
  return -1;
}

/** Link a compound command (if/for/while/{...}) into one statement, so a trailing "| xargs rm" stays attached. */
function mergeBlocks(statements) {
  const out = [];
  for (const statement of statements) {
    if (!CLOSERS.has(statement.find((s) => !s.nested)?.words[0])) {
      out.push(statement);
      continue;
    }
    let depth = 1;
    let merged = statement;
    while (out.length && depth > 0) {
      const previous = out.pop();
      merged = [...previous, ...merged];
      for (const s of previous) {
        if (s.nested || previous.merged) continue;
        const lead = /^(?:if|then|elif|else|do|while|until|!|time|\{|for|case|select)$/;
        for (const w of s.words) {
          if (!lead.test(w)) break;
          if (OPENERS.has(w)) depth--;
        }
      }
    }
    merged.merged = true;
    out.push(merged);
  }
  return out;
}

/**
 * Returns { statements, incomplete }. A statement is a list of linked segments (pipes and nested commands).
 * Segment: { words, redirects, heredocs, nested }. Quotes are removed; "()" and "{}" mark nested commands.
 */
export function parseShell(command, powershell = false) {
  let text = command.replace(/\r\n?/g, '\n');
  // PowerShell treats typographic quotes and dashes as plain ones.
  if (powershell) text = text.replace(/[\u2013-\u2015]/g, '-').replace(/[\u2018\u2019\u201a\u201b]/g, "'").replace(/[\u201c\u201d\u201e]/g, '"');
  const reader = new Reader(text, powershell);
  const statements = reader.list('');
  return { statements, incomplete: reader.incomplete };
}

const KEYWORDS = new Set(['if', 'then', 'elif', 'elseif', 'else', 'do', 'while', 'until', '!', 'time', 'fi', 'done', 'esac', '{', '}']);

/** Command name (lowercase, no path or .exe) and arguments, after keywords, NAME=value, and $name = prefixes. */
export function commandOf(segment) {
  const words = [...segment.words];
  const prefix = [];
  let assigned = false;
  while (words.length) {
    if (KEYWORDS.has(words[0])) words.shift();
    else if (/^[A-Za-z_]\w*\+?=/.test(words[0])) prefix.push(words.shift());
    else if (/^\$[\w:]+$/.test(words[0]) && /^\+?=/.test(words[1] ?? '')) {
      assigned = true;
      words.shift();
      words[0] = words[0].replace(/^\+?=/, '');
      if (!words[0]) words.shift();
    } else if (/^\$[\w:]+\+?=/.test(words[0])) {
      assigned = true;
      words[0] = words[0].replace(/^\$[\w:]+\+?=/, '');
      if (!words[0]) words.shift();
    } else break;
  }
  const name = (words[0] ?? '').split(/[\\/]/).at(-1).toLowerCase().replace(/\.exe$/, '');
  return { name, args: words.slice(1), prefix, assigned };
}
