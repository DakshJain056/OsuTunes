use crate::models::AppConfig;
use reqwest::header::{HeaderMap, COOKIE};
use reqwest::Client;
use scraper::{Html, Selector};
use std::sync::mpsc;
use std::thread;
use tao::event::{Event, WindowEvent};
use tao::event_loop::{ControlFlow, EventLoopBuilder};
use tao::platform::run_return::EventLoopExtRunReturn;
use tao::platform::windows::EventLoopBuilderExtWindows;
use tao::window::WindowBuilder;
use tauri::State;
use wry::WebViewBuilder;

#[tauri::command]
pub async fn logged_in(state: State<'_, AppConfig>) -> Result<bool, String> {
    let cookie = state.osu.cookie.lock().unwrap().clone();
    let mut headers = HeaderMap::new();
    headers.insert(
        COOKIE,
        cookie
            .parse()
            .map_err(|e: reqwest::header::InvalidHeaderValue| e.to_string())?,
    );

    let client = Client::new();
    let url = "https://osu.ppy.sh";
    let response = client
        .get(url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let body = response.text().await.map_err(|e| e.to_string())?;
        let document = Html::parse_document(&body);
        let selector = Selector::parse("div.login-box.login-box--landing").unwrap();
        let found = document.select(&selector).next().is_some();

        Ok(!found)
    } else {
        Err(format!("Request failed with status: {}", response.status()))
    }
}

#[tauri::command]
pub fn login(state: State<'_, AppConfig>) -> Result<(), String> {
    match get_cookie() {
        Ok(cookie) => {
            // Use the cookie string here
            let mut cookie_guard = state.osu.cookie.lock().unwrap();
            *cookie_guard = cookie;
            Ok(())
        }
        Err(e) => Err(e.to_string()),
    }
}

fn get_cookie() -> Result<String, String> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let mut event_loop = EventLoopBuilder::new().with_any_thread(true).build();

        let window = WindowBuilder::new()
            .with_title("Osu! Login")
            .build(&event_loop)
            .unwrap();

        let webview = WebViewBuilder::new()
            .with_devtools(true)
            .build(&window)
            .unwrap();

        webview.clear_all_browsing_data().unwrap();
        webview.load_url("https://osu.ppy.sh").unwrap();

        event_loop.run_return(move |event, _, control_flow| {
            *control_flow = ControlFlow::Wait;
            match event {
                Event::WindowEvent {
                    event: WindowEvent::CloseRequested,
                    ..
                } => {
                    let cookie_result = webview
                        .cookies_for_url("https://osu.ppy.sh")
                        .map(|cookies| {
                            cookies
                                .iter()
                                .map(|cookie| format!("{}={}", cookie.name(), cookie.value()))
                                .collect::<Vec<String>>()
                                .join(";")
                        })
                        .unwrap_or_default();

                    // Send the cookie string through the channel
                    let _ = tx.send(cookie_result);
                    *control_flow = ControlFlow::Exit;
                }
                _ => (),
            }
        });
    });

    // Wait for the cookie value from the spawned thread
    Ok(rx.recv().unwrap())
}
