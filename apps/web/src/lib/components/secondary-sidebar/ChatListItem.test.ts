/**
 * ChatListItem Search Highlighting Tests
 *
 * Tests for the search term highlighting functionality in ChatListItem component
 * Run with: bun test apps/web/src/lib/components/secondary-sidebar/ChatListItem.test.ts
 */

describe('ChatListItem - highlightText function', () => {
  // Extract the highlightText function logic for testing
  function highlightText(text: string, query: string): string {
    if (!query || !query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(
      regex,
      '<mark class="bg-primary/30 text-foreground rounded px-0.5">$1</mark>'
    );
  }

  describe('Basic highlighting', () => {
    it('should return original text when no query is provided', () => {
      const text = 'This is a sample chat title';
      const query = '';
      const result = highlightText(text, query);
      expect(result).toBe(text);
    });

    it('should return original text when query is only whitespace', () => {
      const text = 'This is a sample chat title';
      const query = '   ';
      const result = highlightText(text, query);
      expect(result).toBe(text);
    });

    it('should highlight a simple word match', () => {
      const text = 'Discussion about TypeScript patterns';
      const query = 'TypeScript';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('TypeScript');
      expect(result).toContain('bg-primary/30');
      expect(result).toContain('text-foreground');
    });

    it('should be case-insensitive', () => {
      const text = 'Discussion about typescript patterns';
      const query = 'TYPESCRIPT';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('typescript');
    });

    it('should highlight multiple occurrences of the same word', () => {
      const text = 'AI helps with AI development using AI tools';
      const query = 'AI';
      const result = highlightText(text, query);
      const markCount = (result.match(/<mark/g) || []).length;
      expect(markCount).toBe(3);
    });
  });

  describe('Special characters in query', () => {
    it('should escape regex special characters in query', () => {
      const text = 'Discussion about C++ and C# programming';
      const query = 'C++';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('C++');
    });

    it('should handle special characters like . * ? ^ $ ( ) [ ] { } | \\', () => {
      const text = 'File named test.js and file.ts';
      const query = '.js';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('.js');
    });

    it('should handle question marks in query', () => {
      const text = 'What is the answer? How to fix?';
      const query = '?';
      const result = highlightText(text, query);
      const markCount = (result.match(/<mark/g) || []).length;
      expect(markCount).toBe(2);
    });

    it('should handle parentheses in query', () => {
      const text = 'Function (test) and (demo)';
      const query = '(test)';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('(test)');
    });

    it('should handle square brackets in query', () => {
      const text = 'Array[0] and Array[1]';
      const query = '[0]';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('[0]');
    });

    it('should handle curly braces in query', () => {
      const text = 'Use {key} and {value}';
      const query = '{key}';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('{key}');
    });

    it('should handle pipe character in query', () => {
      const text = 'Use | or || operator';
      const query = '|';
      const result = highlightText(text, query);
      const markCount = (result.match(/<mark/g) || []).length;
      expect(markCount).toBeGreaterThanOrEqual(2);
    });

    it('should handle backslash in query', () => {
      const text = 'Path \\Users\\name';
      const query = '\\';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
    });

    it('should handle caret character in query', () => {
      const text = 'Use ^ for regex start';
      const query = '^';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('^');
    });

    it('should handle dollar sign in query', () => {
      const text = 'Price is $100 and $200';
      const query = '$';
      const result = highlightText(text, query);
      const markCount = (result.match(/<mark/g) || []).length;
      expect(markCount).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty text', () => {
      const text = '';
      const query = 'test';
      const result = highlightText(text, query);
      expect(result).toBe('');
    });

    it('should handle query longer than text', () => {
      const text = 'Hi';
      const query = 'Hello World';
      const result = highlightText(text, query);
      expect(result).toBe('Hi');
    });

    it('should handle Unicode characters in query', () => {
      const text = 'Discussion about café and naïve';
      const query = 'café';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('café');
    });

    it('should handle numbers in query', () => {
      const text = 'Error 404 and status 200';
      const query = '404';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('404');
    });

    it('should handle partial word matches', () => {
      const text = 'TypeScript and JavaScript';
      const query = 'Script';
      const result = highlightText(text, query);
      const markCount = (result.match(/<mark/g) || []).length;
      expect(markCount).toBe(2);
    });

    it('should handle whitespace in query', () => {
      const text = 'Search for this phrase';
      const query = 'this phrase';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('this phrase');
    });
  });

  describe('HTML structure', () => {
    it('should wrap highlighted text in <mark> element', () => {
      const text = 'Discussion about React';
      const query = 'React';
      const result = highlightText(text, query);
      expect(result).toMatch(/<mark[^>]*>React<\/mark>/);
    });

    it('should include correct CSS classes in mark element', () => {
      const text = 'Discussion about Vue';
      const query = 'Vue';
      const result = highlightText(text, query);
      expect(result).toContain('class="bg-primary/30 text-foreground rounded px-0.5"');
    });

    it('should preserve non-matching parts of text', () => {
      const text = 'Discussion about Svelte';
      const query = 'Svelte';
      const result = highlightText(text, query);
      expect(result).toContain('Discussion about');
      expect(result).not.toContain('<mark>Discussion about</mark>');
    });
  });

  describe('Real-world scenarios', () => {
    it('should highlight chat title with search term', () => {
      const text = 'How to implement authentication in Node.js';
      const query = 'authentication';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('authentication');
    });

    it('should highlight message content snippet', () => {
      const text = 'You can use useEffect hook to handle side effects in React components';
      const query = 'useEffect';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('useEffect');
    });

    it('should handle code snippets in search', () => {
      const text = 'Use const x = () => {} for arrow functions';
      const query = '=>';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('=>');
    });

    it('should handle file paths in search', () => {
      const text = 'The file is at /src/components/Button.tsx';
      const query = '/src/components/';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('/src/components/');
    });

    it('should handle technical terms with special chars', () => {
      const text = 'Use $store in Svelte for state management';
      const query = '$store';
      const result = highlightText(text, query);
      expect(result).toContain('<mark');
      expect(result).toContain('$store');
    });
  });

  describe('Performance considerations', () => {
    it('should handle long text efficiently', () => {
      const text =
        'This is a very long chat message that contains a lot of text and the word important appears multiple times throughout this long message. ' +
        'The word important is important to find. This is important for testing. ' +
        'Really important stuff here. Very important indeed.';
      const query = 'important';
      const result = highlightText(text, query);
      const markCount = (result.match(/<mark/g) || []).length;
      expect(markCount).toBe(6);
    });

    it('should not modify text when no match is found', () => {
      const text = 'This is a simple chat message';
      const query = 'nonexistent';
      const result = highlightText(text, query);
      expect(result).toBe(text);
    });
  });
});
