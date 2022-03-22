import { useState } from "react";
import { useMutation } from "@apollo/react-hooks";
import get from "lodash/get";
import { PROVIDE_SIGN_OFF_MUTATION, RETRACT_SIGN_OFF_MUTATION } from "../graphql/provideSignoff";
import { useContentReviewId, useCurrentStepId } from "~/admin/hooks/useContentReviewId";
import { useSnackbar } from "@webiny/app-admin";
import { GET_CHANGE_REQUEST_QUERY } from "~/admin/graphql/changeRequest.gql";
import { useActiveChangeRequestId } from "~/admin/hooks/useCurrentChangeRequestId";
import { GET_CONTENT_REVIEW_QUERY } from "~/admin/views/contentReviewDashboard/hooks/graphql";

interface UseStepSignOffResult {
    provideSignOff: Function;
    retractSignOff: Function;
    loading: boolean;
}

export const useStepSignOff = (): UseStepSignOffResult => {
    const [loading, setLoading] = useState<boolean>(false);
    const { id: stepId } = useCurrentStepId();
    const { id } = useContentReviewId() || { id: "" };
    const { showSnackbar } = useSnackbar();
    const changeRequestId = useActiveChangeRequestId();

    const [provideSignOff] = useMutation(PROVIDE_SIGN_OFF_MUTATION, {
        refetchQueries: [
            {
                query: GET_CHANGE_REQUEST_QUERY,
                variables: { id: changeRequestId }
            },
            {
                query: GET_CONTENT_REVIEW_QUERY,
                variables: {
                    id
                }
            }
        ],
        onCompleted: response => {
            const error = get(response, "apw.provideSignOff.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Sign off provided successfully!");
        }
    });
    const [retractSignOff] = useMutation(RETRACT_SIGN_OFF_MUTATION, {
        refetchQueries: [
            {
                query: GET_CHANGE_REQUEST_QUERY,
                variables: { id: changeRequestId }
            },
            {
                query: GET_CONTENT_REVIEW_QUERY,
                variables: {
                    id
                }
            }
        ],
        onCompleted: response => {
            const error = get(response, "apw.retractSignOff.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Sign off retracted successfully!");
        }
    });

    return {
        provideSignOff: async () => {
            setLoading(true);
            await provideSignOff({ variables: { id, step: stepId } });
            setLoading(false);
        },
        retractSignOff: async () => {
            setLoading(true);
            await retractSignOff({ variables: { id, step: stepId } });
            setLoading(false);
        },
        loading
    };
};