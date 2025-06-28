// ==UserScript==
// @name         Mastodon Hide Interacted Posts (Toggleable)
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Hides posts you've already liked or boosted, toggleable via UI switch in Mastodon WebUI
// @author       @phpmacher
// @match        https://sueden.social/*
// @match        https://*.mastodon.social/*
// @match        https://*.social/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const HIDE_DELAY_MS = 4500;
    const LOCAL_STORAGE_KEY = 'mastodonHideInteractedPosts';

    // Load setting from localStorage
    let hidingEnabled = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';

    // Style definitions
    const style = document.createElement('style');
    style.textContent = `
        .interacted-post-debug {
            background-color: rgba(255, 200, 0, 0.2) !important;
            border: 2px dashed orange !important;
        }
        .interacted-post-hidden {
            display: none !important;
        }
        .interacted-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #444;
            color: #fff;
            padding: 8px 12px;
            font-size: 13px;
            border-radius: 6px;
            z-index: 9999;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            user-select: none;
        }
        .interacted-toggle.active {
            background-color: #2196F3;
        }
    `;
    document.head.appendChild(style);

    // Add toggle button to page
    const toggleButton = document.createElement('div');
    toggleButton.className = 'interacted-toggle' + (hidingEnabled ? ' active' : '');
    toggleButton.textContent = hidingEnabled ? 'Interacted-Hiding: ON' : 'Interacted-Hiding: OFF';
    toggleButton.addEventListener('click', () => {
        hidingEnabled = !hidingEnabled;
        localStorage.setItem(LOCAL_STORAGE_KEY, hidingEnabled);
        toggleButton.classList.toggle('active', hidingEnabled);
        toggleButton.textContent = hidingEnabled ? 'Interacted-Hiding: ON' : 'Interacted-Hiding: OFF';
    });
    document.body.appendChild(toggleButton);

    // Core logic
    const hideInteractedPosts = () => {
        const statuses = document.querySelectorAll('.status');

        statuses.forEach(status => {
            const article = status.closest('article');
            if (!article) return;

            if (
                article.classList.contains('interacted-post-debug') ||
                article.classList.contains('interacted-post-hidden')
            ) {
                return;
            }

            const hasLike = status.querySelector('.status__action-bar__button.star-icon.active');
            const hasBoost = Array.from(
                status.querySelectorAll('.status__action-bar__button.active')
            ).some(btn =>
                btn.getAttribute('title')?.toLowerCase().includes('nicht mehr teilen') ||
                btn.getAttribute('aria-label')?.toLowerCase().includes('nicht mehr teilen') ||
                btn.getAttribute('title')?.toLowerCase().includes('Unboost') ||
                btn.getAttribute('aria-label')?.toLowerCase().includes('Unboost') 
            );

            if (hasLike || hasBoost) {
                article.classList.add('interacted-post-debug');

                if (hidingEnabled) {
                    setTimeout(() => {
                        article.classList.remove('interacted-post-debug');
                        article.classList.add('interacted-post-hidden');
                    }, HIDE_DELAY_MS);
                }
            }
        });
    };

    // Initial run
    hideInteractedPosts();

    // Observe dynamic content
    const observer = new MutationObserver(() => {
        hideInteractedPosts();
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();