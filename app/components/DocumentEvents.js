// @flow
import { action, observable } from "mobx";
import { inject, observer } from "mobx-react";
import { CloseIcon } from "outline-icons";
import * as React from "react";
import { type Match, Redirect, type RouterHistory } from "react-router-dom";
import { Waypoint } from "react-waypoint";
import styled from "styled-components";

import breakpoint from "styled-components-breakpoint";
import { DEFAULT_PAGINATION_LIMIT } from "stores/BaseStore";
import EventListItem from "scenes/Settings/components/EventListItem";
import Button from "components/Button";
import Flex from "components/Flex";
import { ListPlaceholder } from "components/LoadingPlaceholder";
import CollectionsStore from "../stores/CollectionsStore";
import DocumentsStore from "../stores/DocumentsStore";
import EventsStore from "../stores/EventsStore";
import { documentUrl } from "utils/routeHelpers";

type Props = {
  match: Match,
  events: EventsStore,
  documents: DocumentsStore,
  collections: CollectionsStore,
  history: RouterHistory,
};

@observer
class DocumentEvents extends React.Component<Props> {
  @observable isLoaded: boolean = false;
  @observable isFetching: boolean = false;
  @observable offset: number = 0;
  @observable allowLoadMore: boolean = true;
  @observable redirectTo: ?string;

  componentDidMount() {
    this.fetchResults();
  }

  fetchResults = async () => {
    this.isFetching = true;

    const results = await this.props.events.fetchPage({
      limit: DEFAULT_PAGINATION_LIMIT,
      offset: this.offset,
      auditLog: true,
      documentId: this.props.match.params.documentSlug,
    });

    if (
      results &&
      (results.length === 0 || results.length < DEFAULT_PAGINATION_LIMIT)
    ) {
      this.allowLoadMore = false;
    } else {
      this.offset += DEFAULT_PAGINATION_LIMIT;
    }

    this.isLoaded = true;
    this.isFetching = false;
  };

  @action
  loadMoreResults = async () => {
    // Don't paginate if there aren't more results or we’re in the middle of fetching
    if (!this.allowLoadMore || this.isFetching) return;
    await this.fetchResults();
  };

  onClose = () => {
    const document = this.props.documents.getByUrl(
      this.props.match.params.documentSlug
    );
    if (!document) return;
    this.redirectTo = documentUrl(document);
  };

  render() {
    if (this.redirectTo) return <Redirect to={this.redirectTo} push />;
    const { events, documents, collections } = this.props;
    const showLoading = events.isFetching && !events.orderedData.length;

    return (
      <Sidebar>
        <Wrapper column>
          <Header>
            <Title>Events</Title>
            <CloseButton
              icon={<CloseIcon />}
              onClick={this.onClose}
              neutral
              borderOnHover
            />
          </Header>
          <EventWrapper>
            {showLoading ? (
              <ListPlaceholder count={5} />
            ) : (
              <>
                {events.orderedData.map((event) => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    documents={documents}
                    collections={collections}
                  />
                ))}
                {this.allowLoadMore && (
                  <Waypoint key={this.offset} onEnter={this.loadMoreResults} />
                )}
              </>
            )}
          </EventWrapper>
        </Wrapper>
      </Sidebar>
    );
  }
}

// const Loading = styled.div`
//   margin: 0 16px;
// `;

const Wrapper = styled(Flex)`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1;
  width: ${(props) => props.theme.sidebarWidth};
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: none;
`;

const Sidebar = styled(Flex)`
  background: ${(props) => props.theme.background};
  min-width: ${(props) => props.theme.sidebarWidth};
  border-left: 1px solid ${(props) => props.theme.divider};
  z-index: 1;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  align-items: center;
  justify-content: flex-start;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  display: none;
  width: 0;

  ${breakpoint("tablet")`	
    display: flex;
    flex-grow: 1;
  `};
`;

const Header = styled(Flex)`
  position: relative;
  padding: 15.8px;
  border-bottom: 1px solid ${(props) => props.theme.divider};
`;

const CloseButton = styled(Button)`
  position: absolute;
  top: 10px;
  right: 10px;
`;

const EventWrapper = styled.div`
  padding: 5px;
`;

export default inject("documents", "collections", "events")(DocumentEvents);
