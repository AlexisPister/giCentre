// The City Research Online (EPrints) search listing the group's publications.
// scripts/fetch-publications.ts scrapes it into publications.json; the home
// page and /publications link to it as the full, live record.
export const PUBLICATIONS_SEARCH_URL =
    "https://openaccess.city.ac.uk/cgi/search/archive/advanced?dataset=archive&screen=Search&_action_search=Search&title_merge=ALL&title=&creators_name_merge=ANY&creators_name=%22dykes%22%3B%22wood%22%3B%22slingsby%22%3B%22jianu%22%3B%22andrienko%22%3B%22andrienko%22%3B%22reyes-aldasoro%22%3B%22giannopoulos%22%3B%22elshehaly%22%3B%22reljan-delaney%22%3B%22mahyar%22%3B%22moghaddam%22%3B%22pister%22%3B%22hutchinson%22%3B%22laksono%22%3B%22crossley%22%3B%22moussavi%22%3B%22arafat%22%3B%22hosseini%22%3B%22myrvoda%22%3B%22nzemeke%22%3B&date=&keywords_merge=ALL&keywords=&divisions_merge=ANY&subjects_merge=ANY&publication_merge=ALL&publication=&documents_merge=ALL&documents=&satisfyall=ALL&order=-date%2Fcreators_name%2Ftitle";

export const PUBLICATIONS_PORTAL_URL =
    "https://openaccess.city.ac.uk/";

export interface Publication {
    id: number; // EPrints item id
    title: string;
    authors: string[]; // as cited, e.g. "Dykes, J."
    year?: number;
    venue?: string; // journal / proceedings / book title
    link: string; // repository record
    doi?: string;
}
