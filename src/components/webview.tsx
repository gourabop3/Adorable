"use client";

import { requestDevServer as requestDevServerInner } from "./webview-actions";
import "./loader.css";
import {
	FreestyleDevServer,
	FreestyleDevServerHandle,
} from "freestyle-sandboxes/react/dev-server";
import { useRef, useState } from "react";
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

	const refresh = () => {
		if (hasDomain) {
			setIframeLoading(true);
			setReloadKey((k) => k + 1);
		} else {
			devServerRef.current?.refresh();
		}
	};

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
