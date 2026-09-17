"use client";

import { useLayoutEffect } from "react";

import { translateText } from "@/libs/i18n";
import { useI18n } from "@/components/providers/i18n-provider";

const attributeNames = ["placeholder", "aria-label", "title", "alt"] as const;
const ignoredTags = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "NOSCRIPT"]);
const originalTextNodes = new WeakMap<Text, string>();

function shouldSkip(node: Node) {
  const parent = node.parentElement;
  if (!parent) return true;
  if (ignoredTags.has(parent.tagName)) return true;
  if (parent.closest("[data-i18n-skip]")) return true;
  return false;
}

function translateTextNode(node: Text, language: ReturnType<typeof useI18n>["language"]) {
  if (shouldSkip(node)) return;

  const current = node.nodeValue ?? "";
  const original = originalTextNodes.get(node) ?? current;
  if (!original.trim()) return;

  if (!originalTextNodes.has(node)) {
    originalTextNodes.set(node, original);
  }

  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  const translated = translateText(original, language);
  const nextValue = `${leading}${translated}${trailing}`;
  if (nextValue !== current) {
    node.nodeValue = nextValue;
  }
}

function translateAttributes(element: Element, language: ReturnType<typeof useI18n>["language"]) {
  for (const attributeName of attributeNames) {
    const value = element.getAttribute(attributeName);
    if (!value?.trim()) continue;

    const originalAttributeName = `data-i18n-original-${attributeName}`;
    const original = element.getAttribute(originalAttributeName) ?? value;

    if (!element.hasAttribute(originalAttributeName)) {
      element.setAttribute(originalAttributeName, original);
    }

    const translated = translateText(original, language);
    if (translated !== value) {
      element.setAttribute(attributeName, translated);
    }
  }
}

function translateTree(root: ParentNode, language: ReturnType<typeof useI18n>["language"]) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();

  while (textNode) {
    translateTextNode(textNode as Text, language);
    textNode = walker.nextNode();
  }

  if (root instanceof Element) translateAttributes(root, language);
  root.querySelectorAll?.("*").forEach((element) => translateAttributes(element, language));
}

export function AutoTranslate() {
  const { language } = useI18n();

  useLayoutEffect(() => {
    translateTree(document.body, language);
    document.documentElement.dataset.i18nReady = language;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node as Text, language);
            return;
          }

          if (node instanceof Element) {
            translateTree(node, language);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}
