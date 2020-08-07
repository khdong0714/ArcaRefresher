import hidesheet from '../css/hidemodified.css';

export function apply() {
    const css = <style>{hidesheet}</style>;

    if(window.setting.hideModified) {
        document.head.append(css);
    }
}