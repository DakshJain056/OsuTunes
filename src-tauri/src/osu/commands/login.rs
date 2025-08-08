use crate::models::AppConfig;
use reqwest::header::{HeaderMap, COOKIE};
use reqwest::Client;
use scraper::{Html, Selector};
use std::sync::mpsc;
use tauri::{AppHandle, Manager, State, WebviewUrl, WebviewWindowBuilder, WindowEvent};
use url::Url;

#[tauri::command]
pub async fn logged_in(app_handle: AppHandle) -> Result<bool, String> {
    let state = app_handle.state::<AppConfig>();
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
pub async fn login(app: AppHandle, state: State<'_, AppConfig>) -> Result<(), String> {
    match get_cookie(app).await {
        Ok(cookie) => {
            // Use the cookie string here
            let mut cookie_guard = state.osu.cookie.lock().unwrap();
            *cookie_guard = cookie;
            Ok(())
        }
        Err(e) => Err(e.to_string()),
    }
    // println!("entered login");
    // let webview_window = WebviewWindowBuilder::new(
    //         &app,
    //         "login-window", // Unique identifier for the window
    //         WebviewUrl::External(Url::parse("https://osu.ppy.sh").unwrap())
    //     )
    //     .title("Osu! Login") // Set a proper window title
    //     .center() // Center the window on screen
    //     .decorations(true) // Enable window decorations (close, minimize, maximize)
    //     .visible(true) // Make sure the window is visible
    //     .build()
    //     .unwrap();
    //
    // println!("created webview window");
    //
    // let cookie = webview_window
    //     .cookies_for_url(Url::parse("https://osu.ppy.sh").unwrap()).
    //     map(|cookies| {
    //         cookies
    //             .iter()
    //             .map(|cookie| format!("{}={}", cookie.name(), cookie.value()))
    //             .collect::<Vec<String>>()
    //             .join(";")
    //     })
    //     .unwrap_or_default();
    //
    // println!("obtained cookies: {}", cookie);
    // let mut cookie_guard = state.osu.cookie.lock().unwrap();
    // *cookie_guard = cookie;
    //
    // Ok(())
}

async fn get_cookie(app: AppHandle) -> Result<String, String> {
    let (tx, rx) = mpsc::channel();
    let webview_window = WebviewWindowBuilder::new(
            &app,
            "login-window", // Unique identifier for the window
            WebviewUrl::External(Url::parse("https://osu.ppy.sh").unwrap())
        )
        .title("Osu! Login") // Set a proper window title
        .center() // Center the window on screen
        .decorations(true) // Enable window decorations (close, minimize, maximize)
        .visible(true) // Make sure the window is visible
        .build()
        .unwrap();

    webview_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            println!("window close requested, getting final cookies");

            // Get the window reference from the app handle
            let window = app.get_webview_window("login-window")
                .expect("Failed to get window");

            // Get final cookies when user closes the window (presumably after logging in)
            if let Ok(cookies) = window.cookies_for_url(Url::parse("https://osu.ppy.sh").unwrap()) {
                let cookie_string = cookies
                    .iter()
                    .map(|cookie| format!("{}={}", cookie.name(), cookie.value()))
                    .collect::<Vec<String>>()
                    .join(";");

                println!("obtained final cookies after user interaction: {}", cookie_string);

                let _ = tx.send(cookie_string);
            }
        }
    });


    // thread::spawn(move || {
    //     let mut event_loop = EventLoopBuilder::new().with_any_thread(true).build();
    //
    //     let window = WindowBuilder::new()
    //         .with_title("Osu! Login")
    //         .build(&event_loop)
    //         .unwrap();
    //
    //     let webview = WebViewBuilder::new()
    //         .with_devtools(true)
    //         .build(&window)
    //         .unwrap();
    //
    //     webview.clear_all_browsing_data().unwrap();
    //     webview.load_url("https://osu.ppy.sh").unwrap();
    //
    //     event_loop.run_return(move |event, _, control_flow| {
    //         *control_flow = ControlFlow::Wait;
    //         match event {
    //             Event::WindowEvent {
    //                 event: tao::event::WindowEvent::CloseRequested,
    //                 ..
    //             } => {
    //                 let cookie_result = webview
    //                     .cookies_for_url("https://osu.ppy.sh")
    //                     .map(|cookies| {
    //                         cookies
    //                             .iter()
    //                             .map(|cookie| format!("{}={}", cookie.name(), cookie.value()))
    //                             .collect::<Vec<String>>()
    //                             .join(";")
    //                     })
    //                     .unwrap_or_default();
    //
    //                 // Send the cookie string through the channel
    //                 let _ = tx.send(cookie_result);
    //                 *control_flow = ControlFlow::Exit;
    //             }
    //             _ => (),
    //         }
    //     });
    // });

    // Wait for the cookie value from the spawned thread
    Ok(rx.recv().unwrap())
}