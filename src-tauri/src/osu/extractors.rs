use crate::models::{BeatmapPack, Skin};
use scraper::{Html, Selector};

pub fn extract_skins(html: &str) -> Result<(Vec<Skin>, Vec<Skin>), String> {
    let document = Html::parse_document(html);
    let mut winner_skins = Vec::new();
    let mut submission_skins = Vec::new();

    // Extract winner skins
    let podium_selector = Selector::parse("div.skin-grid.podium").map_err(|e| e.to_string())?;
    if let Some(podium) = document.select(&podium_selector).next() {
        winner_skins = extract_skins_from_element(&podium)?;
    }

    // Extract submission skins
    let submission_selector = Selector::parse("div#skin-grid").map_err(|e| e.to_string())?;
    if let Some(submission_grid) = document.select(&submission_selector).last() {
        submission_skins = extract_skins_from_element(&submission_grid)?;
    }

    Ok((winner_skins, submission_skins))
}

pub fn extract_skins_from_element(
    element: &scraper::element_ref::ElementRef,
) -> Result<Vec<Skin>, String> {
    let skin_item_selector = Selector::parse("div.skin-item").map_err(|e| e.to_string())?;
    let name_selector = Selector::parse("span.skin-name").map_err(|e| e.to_string())?;
    let author_selector = Selector::parse("span.author").map_err(|e| e.to_string())?;
    let game_mode_selector = Selector::parse("svg[class^='icon']").map_err(|e| e.to_string())?;
    let link_selector = Selector::parse("a.skin-item__link").map_err(|e| e.to_string())?;

    let skins = element
        .select(&skin_item_selector)
        .map(|skin_item| {
            let skin_name = skin_item
                .select(&name_selector)
                .next()
                .map(|name| name.text().collect::<String>())
                .unwrap_or_default();

            let formatted_author = skin_item
                .select(&author_selector)
                .next()
                .map(|author| author.text().collect::<String>())
                .unwrap_or_default();

            let game_modes = skin_item
                .select(&game_mode_selector)
                .filter_map(|svg| {
                    svg.value()
                        .attr("class")
                        .and_then(|class| class.split_whitespace().nth(1))
                        .map(|mode| mode.to_string())
                })
                .collect();

            let forum_thread_id = skin_item
                .select(&link_selector)
                .next()
                .and_then(|link| link.value().attr("href"))
                .and_then(|href| href.split('/').last())
                .unwrap_or("")
                .to_string();

            Skin {
                skin_name,
                formatted_author,
                game_modes,
                forum_thread_id,
            }
        })
        .collect();

    Ok(skins)
}

pub fn extracts_skin_contests(response: String) -> Result<Vec<(String, String)>, String> {
    let document = Html::parse_document(&response);
    let contest_selector = Selector::parse(".navbar__dropdown-entry").map_err(|e| e.to_string())?;

    let mut contests: Vec<(String, String)> = vec![];
    for element in document.select(&contest_selector) {
        if let Some(text) = element.text().next() {
            if let Some(href) = element.value().attr("href") {
                contests.push((text.trim().to_string(), href.to_string()));
            }
        }
    }

    Ok(contests)
}

pub fn extract_beatpack_pages(html: &str) -> Result<i8, String> {
    let document = Html::parse_document(html);

    let last_page_selector =
        Selector::parse(".pagination-v2__item:last-child .pagination-v2__link")
            .map_err(|e| e.to_string())?;
    if let Some(last_page_element) = document.select(&last_page_selector).next() {
        let last_page = last_page_element.inner_html();
        last_page.parse::<i8>().map_err(|e| e.to_string())
    } else {
        Ok(0)
    }
}

pub fn extract_beatpacks(html: &str) -> Result<Vec<BeatmapPack>, String> {
    let document = Html::parse_document(html);

    let pack_selector = Selector::parse(".beatmap-pack").map_err(|e| e.to_string())?;
    let name_selector = Selector::parse(".beatmap-pack__name").map_err(|e| e.to_string())?;
    let date_selector = Selector::parse(".beatmap-pack__date").map_err(|e| e.to_string())?;
    let author_selector =
        Selector::parse("div.beatmap-pack__details strong").map_err(|e| e.to_string())?;
    let link_selector = Selector::parse(".beatmap-pack__header").map_err(|e| e.to_string())?;

    let mut packs = Vec::new();

    for pack in document.select(&pack_selector) {
        let name = pack
            .select(&name_selector)
            .next()
            .map(|e| e.inner_html().trim().to_string())
            .ok_or_else(|| "Failed to select name".to_string())?;

        let date = pack
            .select(&date_selector)
            .next()
            .map(|e| e.inner_html().trim().to_string())
            .ok_or_else(|| "Failed to select name".to_string())?;

        let author = pack
            .select(&author_selector)
            .next()
            .map(|e| e.inner_html().trim().to_string())
            .ok_or_else(|| "Failed to select name".to_string())?;

        let id = pack
            .select(&link_selector)
            .next()
            .and_then(|link| link.value().attr("href"))
            .and_then(|href| href.split('/').last())
            .unwrap_or("")
            .to_string();

        packs.push(BeatmapPack {
            name,
            date,
            author,
            id,
        });
    }

    Ok(packs)
}

pub fn extract_beatpack_download_url(html: &str) -> Result<String, String> {
    let document = Html::parse_document(html);
    let link_selector =
        Selector::parse("a.beatmap-pack-download__link").map_err(|e| e.to_string())?;

    let donwload_link = document
        .select(&link_selector)
        .next()
        .and_then(|link| link.value().attr("href"))
        .unwrap_or("")
        .to_string();

    Ok(donwload_link)
}

pub fn extract_beatmap_from_beatpack(html: &str) -> Result<Vec<String>, String> {
    let document = Html::parse_document(html);

    let beatmap_selector =
        Selector::parse(".beatmap-pack-items__link").map_err(|e| e.to_string())?;
    let artist_selector =
        Selector::parse(".beatmap-pack-items__artist").map_err(|e| e.to_string())?;
    let song_name_selector =
        Selector::parse(".beatmap-pack-items__title").map_err(|e| e.to_string())?;

    let mut beatmaps = Vec::new();

    for beatmap in document.select(&beatmap_selector) {
        let artist_name = beatmap
            .select(&artist_selector)
            .next()
            .map(|e| e.inner_html().trim().to_string())
            .ok_or_else(|| "Failed to select name".to_string())?;

        let song_name = beatmap
            .select(&song_name_selector)
            .next()
            .map(|e| e.inner_html().trim().to_string())
            .ok_or_else(|| "Failed to select name".to_string())?;

        let beatmap = format!("{}{}", artist_name, song_name);
        beatmaps.push(beatmap);
    }

    Ok(beatmaps)
}
