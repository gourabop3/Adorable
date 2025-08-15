"use client";

import { requestDevServer as requestDevServerInner } from "./webview-actions";
import "./loader.css";
import {
	FreestyleDevServer,
	FreestyleDevServerHandle,
} from "freestyle-sandboxes/react/dev-server";
import { useRef, useState, useEffect } from "react";
import { Button } from "./ui/button";
import { RefreshCwIcon } from "lucide-react";
import { ShareButton } from "./share-button";

export default function WebView(props: {
	repo: string;
	baseId: string;
	appId: string;
	domain?: string;
}) {
	function requestDevServer({ repoId }: { repoId: string }) {
		return requestDevServerInner({ repoId });
	}

	const devServerRef = useRef<FreestyleDevServerHandle>(null);
	const hasDomain = !!props.domain;
	const targetUrl = hasDomain
		? (props.domain!.startsWith("http") ? props.domain! : `https://${props.domain}`)
		: undefined;
	const [reloadKey, setReloadKey] = useState(0);
	const [iframeLoading, setIframeLoading] = useState(true);
	const [devServerReady, setDevServerReady] = useState(false);

	// Check if dev server is ready
	useEffect(() => {
		if (hasDomain) {
			setDevServerReady(true);
		} else {
			// For local dev server, check if it's running
			const checkDevServer = async () => {
				try {
					// Check if there's actual content in the repo
					// This could be enhanced to check specific files or endpoints
					const checkInterval = setInterval(async () => {
						try {
							// You can add more sophisticated checks here
							// For example, check if index.html exists and has content
							// For now, we'll use a timeout as a fallback
							setTimeout(() => {
								setDevServerReady(true);
								clearInterval(checkInterval);
							}, 3000);
						} catch (error) {
							console.log("Dev server not ready yet");
						}
					}, 1000);

					// Fallback: if nothing happens in 10 seconds, show anyway
					setTimeout(() => {
						setDevServerReady(true);
						clearInterval(checkInterval);
					}, 10000);
				} catch (error) {
					console.log("Dev server check failed");
					// Fallback: show after delay
					setTimeout(() => setDevServerReady(true), 5000);
				}
			};
			checkDevServer();
		}
	}, [hasDomain]);

	const refresh = () => {
		if (hasDomain) {
			setIframeLoading(true);
			setReloadKey((k) => k + 1);
		} else {
			devServerRef.current?.refresh();
		}
	};

	// Show "Coming Soon" until dev server is ready
	if (!devServerReady) {
		return (
			<div className="flex flex-col overflow-hidden h-screen border-l transition-opacity duration-700 mt-[2px]">
				<div className="h-12 border-b border-gray-200 items-center flex px-2 bg-background sticky top-0 justify-end gap-2">
					<Button
						variant={"ghost"}
						size={"icon"}
						onClick={refresh}
					>
						<RefreshCwIcon />
					</Button>
					<ShareButton domain={props.domain} appId={props.appId} />
				</div>
				<div className="flex-1 flex items-center justify-center bg-background">
					<div className="text-center space-y-4">
						<div className="text-4xl font-bold text-gray-300">🚀</div>
						<h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
							App Coming Soon
						</h2>
						<p className="text-gray-500 dark:text-gray-400 max-w-md">
							Your AI assistant is building your app. This preview will appear once the development server is ready.
						</p>
						<div className="loader mx-auto"></div>
						<p className="text-sm text-gray-400">
							Tip: Ask the AI to create or modify your app to see the preview
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col overflow-hidden h-screen border-l transition-opacity duration-700 mt-[2px]">
			<div className="h-12 border-b border-gray-200 items-center flex px-2 bg-background sticky top-0 justify-end gap-2">
				<Button
					variant={"ghost"}
					size={"icon"}
					onClick={refresh}
				>
					<RefreshCwIcon />
				</Button>
				<ShareButton domain={props.domain} appId={props.appId} />
			</div>
			{hasDomain ? (
				<div className="relative flex-1 min-h-0">
					{iframeLoading && (
						<div className="absolute inset-0 flex items-center justify-center bg-background/50">
							<div>
								<div className="text-center">Loading Preview</div>
								<div>
									<div className="loader"></div>
								</div>
							</div>
						</div>
					)}
					<iframe
						key={reloadKey}
						src={targetUrl}
						onLoad={() => setIframeLoading(false)}
						className="w-full h-full border-0"
						title="App Preview"
					/>
				</div>
			) : (
				<FreestyleDevServer
					ref={devServerRef}
					actions={{ requestDevServer }}
					repoId={props.repo}
					loadingComponent={({ iframeLoading, devCommandRunning }) =>
						!devCommandRunning && (
							<div className="flex items-center justify-center h-full">
								<div>
									<div className="text-center">
										{iframeLoading ? "JavaScript Loading" : "Starting VM"}
									</div>
									<div>
										<div className="loader"></div>
									</div>
								</div>
							</div>
						)
					}
				/>
			)}
		</div>
	);
}
