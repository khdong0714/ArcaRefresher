import * as DateManager from './DateManager';
import * as PreviewFilter from './PreviewFilter';
import * as BlockSystem from './BlockSystem';
import * as IPScouter from './IPScouter';
import * as UserMemo from './UserMemo';

import styles, { stylesheet } from '../css/Refresher.module.css';

function initLoader() {
    document.head.append(<style>{stylesheet}</style>);
    const loader = <div id="article_loader" class={styles.loader} />;
    document.body.append(loader);

    return loader;
}

function playLoader(loader, time) {
    if(loader) {
        loader.removeAttribute('style');
        setTimeout(() => {
            loader.setAttribute('style', `animation: ${styles.loaderspin} ${time}s ease-in-out`);
        }, 50);
    }
}

function getRefreshArticle() {
    return new Promise((resolve) => {
        const req = new XMLHttpRequest();

        req.open('GET', window.location.href);
        req.responseType = 'document';
        req.addEventListener('load', () => {
            const articles = req.response.querySelectorAll('a[class="vrow"]');
            resolve(articles);
        });
        req.send();
    });
}

function swapNewArticle(newArticles) {
    const board = document.querySelector('.board-article-list .list-table, .included-article-list .list-table');
    const oldArticles = board.querySelectorAll('a.vrow:not(.notice)');

    const oldnums = [];
    for(const o of oldArticles) {
        oldnums.push(o.pathname.split('/')[3]);
        o.remove();
    }

    for(const n of newArticles) {
        if(oldnums.indexOf(n.pathname.split('/')[3]) == -1) {
            n.setAttribute('style', `animation: ${styles.light} 0.5s`);
        }

        const lazywrapper = n.querySelector('noscript');
        if(lazywrapper) lazywrapper.outerHTML = lazywrapper.innerHTML;

        const time = n.querySelector('time');
        if(DateManager.in24(time.dateTime)) {
            time.innerText = DateManager.getTimeStr(time.dateTime);
        }
    }

    board.append(...newArticles);

    return newArticles;
}

export function run(channel) {
    const refreshTime = window.config.refreshTime;

    if(refreshTime == 0) return;

    let loader = null;
    if(!window.config.hideRefresher) {
        loader = initLoader();
    }
    playLoader(loader, refreshTime);

    async function routine() {
        const articles = swapNewArticle(await getRefreshArticle());
        playLoader(loader, refreshTime);
        PreviewFilter.filter(articles, channel);
        BlockSystem.blockArticle(articles);
        UserMemo.apply();
        IPScouter.applyArticles(articles);
    }

    let loadLoop = null;
    loadLoop = setInterval(routine, refreshTime * 1000);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(loadLoop);
            loadLoop = null;
        }
        else {
            if (loadLoop == null) {
                playLoader(loader, refreshTime);
                loadLoop = setInterval(routine, refreshTime * 1000);
            }
        }
    });
    document.addEventListener('click', event => {
        if(event.target.tagName != 'INPUT') return;

        if(event.target.classList.contains('batch-check-all')) {
            if(event.target.checked) {
                clearInterval(loadLoop);
                loadLoop = null;
            }
            else {
                playLoader(loader, refreshTime);
                loadLoop = setInterval(routine, refreshTime * 1000);
            }
        }
        else {
            const btns = document.querySelectorAll('.batch-check');
            for(const btn of btns) {
                if(btn.checked) {
                    clearInterval(loadLoop);
                    loadLoop = null;
                    return;
                }
            }

            playLoader(loader, refreshTime);
            loadLoop = setInterval(routine, refreshTime * 1000);
        }
    });
}