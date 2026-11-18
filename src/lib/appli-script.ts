/**
 * Application mobile (iOS / Android, Capacitor) : le site est affiché dans une coque native
 * qui ajoute « ArtopifApp » à l'agent utilisateur (capacitor.config.ts).
 *
 * Aperçu dans un navigateur : ouvrir n'importe quelle page avec ?appli=1 (?appli=0 pour
 * revenir au site). Le choix est gardé le temps de l'onglet.
 *
 * Le script SCRIPT_DETECTION (dans <head>) pose data-appli sur <html> avant l'affichage :
 * le CSS masque alors le pied de page du site et montre la barre d'onglets, sans clignotement.
 */
export const CLE_APERCU = "artopif-apercu-appli";

export const SCRIPT_DETECTION = `(function(){try{var q=new URLSearchParams(location.search).get("appli");if(q==="1")sessionStorage.setItem("${CLE_APERCU}","1");if(q==="0")sessionStorage.removeItem("${CLE_APERCU}");if(/ArtopifApp/.test(navigator.userAgent)||sessionStorage.getItem("${CLE_APERCU}")==="1")document.documentElement.setAttribute("data-appli","1")}catch(e){}})();`;
